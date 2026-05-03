import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Upload, Save, Palette, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function BrandingSettings() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: systemSettings, isLoading } = trpc.settings.getSystemSettings.useQuery();

  const [primaryColor, setPrimaryColor] = useState('#e11d48');
  const [logoUrl, setLogoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (systemSettings) {
      setPrimaryColor(systemSettings.primaryColor ?? '#e11d48');
      setLogoUrl(systemSettings.restaurantLogo ?? '');
    }
  }, [systemSettings]);

  const uploadLogo = trpc.settings.uploadLogo.useMutation({
    onSuccess: (data) => {
      setLogoUrl(data.url);
      setIsUploading(false);
      toast.success('Logo uploaded successfully');
    },
    onError: (err) => {
      setIsUploading(false);
      toast.error(`Upload failed: ${err.message}`);
    }
  });

  const saveSettings = trpc.settings.updateSystemSettings.useMutation({
    onSuccess: () => {
      toast.success('Branding settings saved');
      utils.settings.getSystemSettings.invalidate();
      
      // Immediate Style Injection
      const styleId = 'custom-brand-styles';
      let styleTag = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = `
        :root {
          --primary: ${primaryColor} !important;
          --ring: ${primaryColor} !important;
        }
        .dark {
          --primary: ${primaryColor} !important;
          --ring: ${primaryColor} !important;
        }
      `;
    },
    onError: (err) => toast.error(`Failed to save settings: ${err.message}`),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        uploadLogo.mutate({
            fileName: file.name,
            fileType: file.type,
            base64
        });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    saveSettings.mutate({
      primaryColor,
      restaurantLogo: logoUrl
    });
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/settings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Branding & Personality</h1>
            <p className="text-muted-foreground">Customize your restaurant's digital identity</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saveSettings.isPending} size="lg" className="shadow-lg hover:shadow-xl transition-all">
          {saveSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Brand Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-2 border-primary/10">
            <CardHeader className="bg-muted/50 border-b">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">Brand Logo</CardTitle>
              </div>
              <CardDescription>Upload your restaurant logo. SVG or PNG recommended.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors relative group">
                {logoUrl ? (
                  <div className="relative">
                    <img src={logoUrl} alt="Logo Preview" className="max-h-40 object-contain drop-shadow-md" />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setLogoUrl('')}
                    >
                      <ArrowLeft className="w-4 h-4 rotate-45" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">Click to upload logo</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG, SVG up to 5MB</p>
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-sm rounded-xl">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2 border-primary/10">
            <CardHeader className="bg-muted/50 border-b">
                <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">Primary Brand Color</CardTitle>
                </div>
              <CardDescription>This color will be used for buttons, primary actions, and system highlights.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-6">
                <div 
                  className="w-24 h-24 rounded-2xl shadow-inner border-4 border-white dark:border-zinc-800" 
                  style={{ backgroundColor: primaryColor }}
                />
                <div className="flex-1 space-y-2">
                  <Label>Pick a Color</Label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      className="w-20 h-10 p-1 cursor-pointer rounded border" 
                      value={primaryColor} 
                      onChange={e => setPrimaryColor(e.target.value)} 
                    />
                    <Input 
                      className="font-mono" 
                      value={primaryColor} 
                      onChange={e => setPrimaryColor(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-6 gap-2 pt-4">
                {['#e11d48', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(c => (
                  <button
                    key={c}
                    className="h-10 w-full rounded-md border shadow-sm transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                    onClick={() => setPrimaryColor(c)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview */}
        <div className="space-y-6">
          <Card className="sticky top-6 overflow-hidden border-2 border-primary/20 shadow-xl">
            <CardHeader className="bg-primary text-primary-foreground transition-all duration-300" style={{ backgroundColor: primaryColor }}>
              <CardTitle>Live Brand Preview</CardTitle>
              <CardDescription className="text-primary-foreground/80">See how your brand looks in real-time</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Mockup elements */}
              <div className="space-y-4 p-4 border rounded-xl bg-card">
                <div className="flex items-center gap-3">
                  {logoUrl ? <img src={logoUrl} className="w-8 h-8 object-contain" alt="Logo" /> : <div className="w-8 h-8 rounded bg-muted" />}
                  <div className="font-bold">RestoFlow</div>
                </div>
                
                <div className="space-y-2">
                  <div className="h-2 w-2/3 bg-muted rounded" />
                  <div className="h-2 w-full bg-muted rounded" />
                </div>

                <div className="flex gap-2">
                  <Button size="sm" style={{ backgroundColor: primaryColor, color: '#fff' }}>Primary Action</Button>
                  <Button size="sm" variant="outline">Secondary</Button>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                   <div 
                     className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" 
                     style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                   >
                     Active Tab
                   </div>
                   <div className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                     Inactive
                   </div>
                </div>
              </div>

              <div className="p-4 border rounded-xl bg-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                      <Palette className="w-5 h-5" style={{ color: primaryColor }} />
                   </div>
                   <div>
                     <div className="text-sm font-medium">System Alert</div>
                     <div className="text-xs text-muted-foreground">Check your metrics</div>
                   </div>
                </div>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
              </div>

              <div className="text-center p-6 bg-muted/30 rounded-xl space-y-2">
                 <p className="text-xs text-muted-foreground italic truncate">
                    "Your identity is the soul of your restaurant."
                 </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
