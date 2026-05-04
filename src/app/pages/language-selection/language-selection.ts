import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

interface LanguageOption {
  code: 'ar' | 'en' | 'ur' | 'fr' | 'id' | 'fa' | 'tr' | 'ms';
  nameArabic: string;
  nameEnglish: string;
  flagId: string;
}

@Component({
  selector: 'app-language-selection',
  standalone: true,
  templateUrl: './language-selection.html',
  styleUrl: './language-selection.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelection {
  protected readonly languages: LanguageOption[] = [
    { code: 'ar', nameArabic: 'العربية', nameEnglish: 'Arabic', flagId: 'flag-sa' },
    { code: 'en', nameArabic: 'الإنجليزية', nameEnglish: 'English', flagId: 'flag-gb' },
    { code: 'ur', nameArabic: 'أوردو', nameEnglish: 'Urdu', flagId: 'flag-pk' },
    { code: 'fr', nameArabic: 'الفرنسية', nameEnglish: 'French', flagId: 'flag-fr' },
    { code: 'id', nameArabic: 'الأندونيسية', nameEnglish: 'Indonesian', flagId: 'flag-id' },
    { code: 'fa', nameArabic: 'الفارسية', nameEnglish: 'Persian', flagId: 'flag-ir' },
    { code: 'tr', nameArabic: 'التركية', nameEnglish: 'Turkish', flagId: 'flag-tr' },
    { code: 'ms', nameArabic: 'الماليزية', nameEnglish: 'Malaysian', flagId: 'flag-my' },
  ];

  constructor(private readonly router: Router) {}

  protected select(language: LanguageOption): void {
    this.router.navigate(['/services'], { queryParams: { lang: language.code } });
  }
}
