import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  const t = useTranslations('home');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold mb-2">{t('title')}</CardTitle>
          <CardDescription className="text-lg">
            {t('subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              {t('description')}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  {t('goToDashboard')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 space-y-4 pt-6 border-t">
            <h3 className="font-semibold text-lg">{t('howToUse')}</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>{t('step1')}</li>
              <li>{t('step2')}</li>
              <li>{t('step3')}</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
