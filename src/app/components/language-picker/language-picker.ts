import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { LookupsService } from '../../services/lookups';

type LangCode = 'ar' | 'en' | 'fa' | 'fr' | 'in' | 'tr' | 'ml' | 'ur' | 'hi';

interface LanguageMeta {
  code: LangCode;
  flagId: string;
  flagImage?: string;
}

interface LanguageOption {
  id: string;
  code: LangCode;
  flagId: string;
  flagImage?: string;
  nameEnglish: string;
}

const LANGUAGE_META: Record<string, LanguageMeta> = {
  Arabic: { code: 'ar', flagId: 'flag-sa', flagImage: 'lang/ar.jpeg' },
  English: { code: 'en', flagId: 'flag-gb', flagImage: 'lang/en.png' },
  Farsi: { code: 'fa', flagId: 'flag-ir', flagImage: 'lang/fa.jpeg' },
  French: { code: 'fr', flagId: 'flag-fr' },
  Indonesian: { code: 'in', flagId: 'flag-id' },
  Malaysian: { code: 'ml', flagId: 'flag-my' },
  Turkish: { code: 'tr', flagId: 'flag-tr' },
  Urdu: { code: 'ur', flagId: 'flag-pk' },
  Hindi: { code: 'hi', flagId: 'flag-in' },
};

@Component({
  selector: 'app-language-picker',
  standalone: true,
  templateUrl: './language-picker.html',
  styleUrl: './language-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguagePicker {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lookups = inject(LookupsService);

  protected readonly languages = signal<LanguageOption[]>([]);

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly currentLang = computed(() => this.params().get('lang') ?? '');

  constructor() {
    this.lookups.getLanguages().subscribe({
      next: (items) => {
        this.languages.set(
          items
            .map((item): LanguageOption | null => {
              const meta = LANGUAGE_META[item.code];
              if (!meta) return null;
              return {
                id: item.id,
                code: meta.code,
                flagId: meta.flagId,
                flagImage: meta.flagImage,
                nameEnglish: item.name,
              };
            })
            .filter((opt): opt is LanguageOption => opt !== null),
        );
      },
    });
  }

  protected select(language: LanguageOption): void {
    if (this.currentLang() === language.code) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { lang: language.code, languageId: language.id },
      queryParamsHandling: 'merge',
    });
  }
}
