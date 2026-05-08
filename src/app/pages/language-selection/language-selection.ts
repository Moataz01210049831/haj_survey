import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { LookupItem, LookupsService } from '../../services/lookups';

type LangCode = 'ar' | 'en' | 'fa' | 'fr' | 'in' | 'tr' | 'ml';

interface LanguageMeta {
  code: LangCode;
  nameArabic: string;
  flagId: string;
}

interface LanguageOption {
  id: string;
  code: LangCode;
  nameArabic: string;
  nameEnglish: string;
  flagId: string;
}

// Local mapping from API "Code" to display metadata (the API only returns English names + GUID).
const LANGUAGE_META: Record<string, LanguageMeta> = {
  Arabic: { code: 'ar', nameArabic: 'العربية', flagId: 'flag-sa' },
  English: { code: 'en', nameArabic: 'الإنجليزية', flagId: 'flag-gb' },
  Farsi: { code: 'fa', nameArabic: 'الفارسية', flagId: 'flag-ir' },
  French: { code: 'fr', nameArabic: 'الفرنسية', flagId: 'flag-fr' },
  Indonesian: { code: 'in', nameArabic: 'الأندونيسية', flagId: 'flag-id' },
  Malaysian: { code: 'ml', nameArabic: 'الماليزية', flagId: 'flag-my' },
  Turkish: { code: 'tr', nameArabic: 'التركية', flagId: 'flag-tr' },
};

@Component({
  selector: 'app-language-selection',
  standalone: true,
  templateUrl: './language-selection.html',
  styleUrl: './language-selection.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelection {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lookups = inject(LookupsService);

  protected readonly facilityId =
    this.route.snapshot.queryParamMap.get('facilityId') ??
    this.route.snapshot.queryParamMap.get('entityId') ??
    '';

  protected readonly languages = signal<LanguageOption[]>([]);
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly facilityName = signal<string>('');

  protected readonly hasLanguages = computed(() => this.languages().length > 0);

  constructor() {
    this.loadLanguages();
    this.loadFacility();
  }

  protected select(language: LanguageOption): void {
    this.router.navigate(['/services'], {
      queryParams: {
        lang: language.code,
        languageId: language.id,
        facilityId: this.facilityId,
      },
    });
  }

  protected retry(): void {
    this.loadLanguages();
  }

  private loadLanguages(): void {
    this.loading.set(true);
    this.error.set(null);

    this.lookups.getLanguages().subscribe({
      next: (items) => {
        this.languages.set(this.toOptions(items));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load languages');
        this.loading.set(false);
      },
    });
  }

  private loadFacility(): void {
    this.lookups.getFacility(this.facilityId, 'ar').subscribe({
      next: (facility) => {
        if (facility) this.facilityName.set(facility.name);
      },
      error: (err) => console.error('[language-selection] Facility fetch failed', err),
    });
  }

  private toOptions(items: LookupItem[]): LanguageOption[] {
    return items
      .map((item) => {
        const meta = LANGUAGE_META[item.code];
        if (!meta) return null;
        return {
          id: item.id,
          code: meta.code,
          nameArabic: meta.nameArabic,
          nameEnglish: item.name,
          flagId: meta.flagId,
        };
      })
      .filter((option): option is LanguageOption => option !== null);
  }
}
