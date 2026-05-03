import { getDb } from "../db";
import { zReports, integrations, integrationLogs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface GLAccountMapping {
  salesAccountId: string;        // Credit
  tipsPayableAccountId: string;  // Credit
  cashAccountId: string;         // Debit
  cardAccountId: string;         // Debit
  splitAccountId: string;        // Debit
  discountAccountId: string;     // Debit
  voidAccountId: string;         // Debit
  overShortAccountId: string;    // Debit/Credit (used to balance if there's a discrepancy)
}

export interface JournalLine {
  description: string;
  accountId: string;
  amount: number;
  isDebit: boolean;
}

export interface StandardJournal {
  reference: string;
  date: string;
  lines: JournalLine[];
}

export class GeneralLedgerExportService {
  /**
   * Generates a balanced double-entry journal from a Z-Report.
   */
  static async generateStandardJournal(reportId: number, mapping: GLAccountMapping): Promise<StandardJournal | null> {
    const db = await getDb() as any;
    
    // 1. Fetch the Z-Report
    const reportList = await db.select().from(zReports).where(eq(zReports.id, reportId));
    if (!reportList || reportList.length === 0) {
      return null;
    }
    const report = reportList[0];

    const lines: JournalLine[] = [];

    const cash = parseFloat(report.cashTotal);
    const card = parseFloat(report.cardTotal);
    const split = parseFloat(report.splitTotal);
    const discounts = parseFloat(report.totalDiscounts);
    const voids = parseFloat(report.totalVoids);
    
    // Determine debits (where did the money go, or what reduced the revenue)
    let totalDebits = 0;
    if (cash > 0) {
      lines.push({ description: "Cash Collected", accountId: mapping.cashAccountId, amount: cash, isDebit: true });
      totalDebits += cash;
    }
    if (card > 0) {
      lines.push({ description: "Card Collected", accountId: mapping.cardAccountId, amount: card, isDebit: true });
      totalDebits += card;
    }
    if (split > 0) {
      lines.push({ description: "Split/Other Payments", accountId: mapping.splitAccountId, amount: split, isDebit: true });
      totalDebits += split;
    }
    if (discounts > 0) {
      lines.push({ description: "Discounts Given", accountId: mapping.discountAccountId, amount: discounts, isDebit: true });
      totalDebits += discounts;
    }
    if (voids > 0) {
      lines.push({ description: "Voids", accountId: mapping.voidAccountId, amount: voids, isDebit: true });
      totalDebits += voids;
    }

    // Determine credits (where did the money come from)
    // We treat totalRevenue as Gross.
    const revenue = parseFloat(report.totalRevenue);
    const tips = parseFloat(report.totalTips);
    let totalCredits = 0;

    if (revenue > 0) {
      lines.push({ description: "Gross Sales Revenue", accountId: mapping.salesAccountId, amount: revenue, isDebit: false });
      totalCredits += revenue;
    }
    if (tips > 0) {
      lines.push({ description: "Tips Collected", accountId: mapping.tipsPayableAccountId, amount: tips, isDebit: false });
      totalCredits += tips;
    }

    // Balance the journal entry if there is a discrepancy (over/short)
    const difference = totalDebits - totalCredits;
    // Fix floating point math issues
    const roundedDiff = Math.abs(Math.round(difference * 100) / 100);

    if (roundedDiff > 0) {
        if (difference > 0) {
            // Debits > Credits (Over) - Need Credit to balance
            lines.push({ description: "Cash Over/Short", accountId: mapping.overShortAccountId, amount: roundedDiff, isDebit: false });
        } else {
            // Credits > Debits (Short) - Need Debit to balance
            lines.push({ description: "Cash Over/Short", accountId: mapping.overShortAccountId, amount: roundedDiff, isDebit: true });
        }
    }

    return {
      reference: `Z-Report-${report.id}`,
      date: report.reportDate,
      lines
    };
  }

  /**
   * Translates the StandardJournal to QuickBooks Online JournalEntry format.
   */
  static formatForQuickBooks(journal: StandardJournal) {
    return {
      JournalEntry: {
        TxnDate: journal.date,
        DocNumber: journal.reference,
        Line: journal.lines.map((line, index) => ({
          Id: index.toString(),
          Description: line.description,
          Amount: line.amount,
          DetailType: "JournalEntryLineDetail",
          JournalEntryLineDetail: {
            PostingType: line.isDebit ? "Debit" : "Credit",
            AccountRef: {
              value: line.accountId
            }
          }
        }))
      }
    };
  }

  /**
   * Translates the StandardJournal to Xero ManualJournals format.
   */
  static formatForXero(journal: StandardJournal) {
    return {
      Journals: [
        {
          JournalDate: journal.date,
          Narration: `Daily Sales Integration - ${journal.reference}`,
          JournalLines: journal.lines.map(line => ({
            Description: line.description,
            // Xero API typically uses positive LineAmount for Debits and negative for Credits on ManualJournals endpoint
            LineAmount: line.isDebit ? Math.abs(line.amount) : -Math.abs(line.amount),
            AccountCode: line.accountId
          }))
        }
      ]
    };
  }

  /**
   * Triggers export to configured platforms using stored credentials.
   */
  static async exportDailySalesToGL(reportId: number) {
    const db = await getDb() as any;

    try {
      // 1. Fetch enabled Integrations
      const activeIntegrations = await db.select().from(integrations)
        .where(eq(integrations.isEnabled, true));
      const accountingSystems = activeIntegrations.filter((i: any) => i.type === "quickbooks" || i.type === "xero");

      for (const integration of accountingSystems) {
        if (!integration.config) {
          console.warn(`[GeneralLedgerExportService] Integration ${integration.name} missing config payload.`);
          continue;
        }

        let config: any = {};
        try {
          config = JSON.parse(integration.config);
        } catch(e) {
          console.error(`[GeneralLedgerExportService] Failed to parse config JSON for ${integration.name}`);
          continue;
        }

        const mapping: GLAccountMapping = config.accountMapping;
        if (!mapping) {
          console.warn(`[GeneralLedgerExportService] Integration ${integration.name} missing accountMapping in config.`);
          continue;
        }

        const journal = await this.generateStandardJournal(reportId, mapping);
        if (!journal) {
          console.error(`[GeneralLedgerExportService] Unable to locate Z-Report ID ${reportId}.`);
          continue;
        }

        // 2. Format Payload
        let payload;
        if (integration.type === "quickbooks") {
          payload = this.formatForQuickBooks(journal);
        } else if (integration.type === "xero") {
          payload = this.formatForXero(journal);
        }

        console.info(`[GeneralLedgerExportService] Successfully generated payload for ${integration.type}`);
        
        // Push integration log
        await db.insert(integrationLogs).values({
          integrationId: integration.id,
          action: "sync",
          status: "success",
          message: `Generated Daily Sales Journal Entry for Z-Report ${reportId}`,
          requestData: JSON.stringify(payload),
        });
      }
    } catch (error: any) {
      console.error(`[GeneralLedgerExportService] Export failed:`, error);
    }
  }
}
