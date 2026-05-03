import { describe, it, expect } from 'vitest';
import { GeneralLedgerExportService, StandardJournal, GLAccountMapping } from './services/GeneralLedgerExportService';

describe('GeneralLedgerExportService', () => {
  const mockMapping: GLAccountMapping = {
    salesAccountId: '200',
    tipsPayableAccountId: '210',
    cashAccountId: '100',
    cardAccountId: '101',
    splitAccountId: '102',
    discountAccountId: '400',
    voidAccountId: '401',
    overShortAccountId: '499',
  };

  const mockJournal: StandardJournal = {
    reference: 'Z-Report-123',
    date: '2026-03-29',
    lines: [
      { description: 'Cash Collected', accountId: mockMapping.cashAccountId, amount: 50.00, isDebit: true },
      { description: 'Card Collected', accountId: mockMapping.cardAccountId, amount: 200.00, isDebit: true },
      { description: 'Discounts Given', accountId: mockMapping.discountAccountId, amount: 25.00, isDebit: true },
      { description: 'Gross Sales Revenue', accountId: mockMapping.salesAccountId, amount: 250.00, isDebit: false },
      { description: 'Tips Collected', accountId: mockMapping.tipsPayableAccountId, amount: 25.00, isDebit: false }
    ]
  };

  it('should format a balanced journal for QuickBooks Online', () => {
    const qboPayload = GeneralLedgerExportService.formatForQuickBooks(mockJournal);
    
    expect(qboPayload).toBeDefined();
    expect(qboPayload.JournalEntry.TxnDate).toBe('2026-03-29');
    expect(qboPayload.JournalEntry.DocNumber).toBe('Z-Report-123');
    
    const lines = qboPayload.JournalEntry.Line;
    expect(lines).toHaveLength(5);
    
    // Verify debits vs credits
    expect(lines[0].JournalEntryLineDetail.PostingType).toBe('Debit');
    expect(lines[0].Amount).toBe(50.00);
    expect(lines[0].JournalEntryLineDetail.AccountRef.value).toBe('100');

    expect(lines[3].JournalEntryLineDetail.PostingType).toBe('Credit');
    expect(lines[3].Amount).toBe(250.00);
    expect(lines[3].JournalEntryLineDetail.AccountRef.value).toBe('200');
  });

  it('should format a balanced journal for Xero ManualJournals', () => {
    const xeroPayload = GeneralLedgerExportService.formatForXero(mockJournal);
    
    expect(xeroPayload).toBeDefined();
    expect(xeroPayload.Journals).toHaveLength(1);
    
    const journal = xeroPayload.Journals[0];
    expect(journal.JournalDate).toBe('2026-03-29');
    expect(journal.Narration).toContain('Z-Report-123');
    
    const lines = journal.JournalLines;
    expect(lines).toHaveLength(5);
    
    // Verify positive/negative amounts for Debit/Credit
    // Positive for debit
    expect(lines[0].LineAmount).toBe(50.00);
    expect(lines[0].AccountCode).toBe('100');
    
    // Negative for credit
    expect(lines[3].LineAmount).toBe(-250.00);
    expect(lines[3].AccountCode).toBe('200');
  });
});
