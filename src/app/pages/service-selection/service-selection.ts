import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { LookupsService } from '../../services/lookups';

type LangCode = 'ar' | 'en' | 'fa' | 'fr' | 'in' | 'tr' | 'ml';

interface LocalizedText {
  ar: string;
  en: string;
  fa?: string;
  fr?: string;
  in?: string;
  tr?: string;
  ml?: string;
}

interface Service {
  id: string;
  name: string;
}

const UI_STRINGS = {
  title: {
    ar: 'استبيان الرضا عن الخدمات الطبية - موسم الحج 2026',
    en: 'Medical Services Satisfaction Survey - Hajj Season 2026',
  },
  prompt: {
    ar: 'الرجاء اختيار الخدمة التي تلقيتها',
    en: 'Please select the service you received',
  },
  loading: {
    ar: 'جاري تحميل الخدمات…',
    en: 'Loading services…',
  },
  errorLoading: {
    ar: 'فشل تحميل الخدمات',
    en: 'Failed to load services',
  },
  retry: {
    ar: 'إعادة المحاولة',
    en: 'Retry',
  },
} satisfies Record<string, LocalizedText>;

@Component({
  selector: 'app-service-selection',
  standalone: true,
  templateUrl: './service-selection.html',
  styleUrl: './service-selection.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceSelection {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lookups = inject(LookupsService);

  protected readonly lang = signal<LangCode>(
    (this.route.snapshot.queryParamMap.get('lang') as LangCode) ?? 'ar',
  );
  protected readonly languageId =
    this.route.snapshot.queryParamMap.get('languageId') ?? '';
  protected readonly facilityId =
    this.route.snapshot.queryParamMap.get('facilityId') ?? '';

  protected readonly services = signal<Service[]>([]);
  protected readonly loading = signal<boolean>(true);
  protected readonly loadError = signal<boolean>(false);

  protected readonly facilityName = signal<string>('');

  protected readonly title = computed(() => this.t(UI_STRINGS.title));
  protected readonly prompt = computed(() => this.t(UI_STRINGS.prompt));
  protected readonly loadingLabel = computed(() => this.t(UI_STRINGS.loading));
  protected readonly errorLabel = computed(() => this.t(UI_STRINGS.errorLoading));
  protected readonly retryLabel = computed(() => this.t(UI_STRINGS.retry));

  constructor() {
    this.loadServices();
    this.loadFacility();
  }

  protected select(service: Service): void {
    this.router.navigate(['/survey'], {
      queryParams: {
        lang: this.lang(),
        languageId: this.languageId,
        facilityId: this.facilityId,
        service: service.id,
      },
    });
  }

  protected retry(): void {
    this.loadServices();
  }

  private loadServices(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.lookups.getClassifications(this.lang()).subscribe({
      next: (items) => {
        this.services.set(items.map((item) => ({ id: item.id, name: item.name })));
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadFacility(): void {
    if (!this.facilityId) return;

    this.lookups.getFacility(this.facilityId, this.lang()).subscribe({
      next: (facility) => {
        if (facility) this.facilityName.set(facility.name);
      },
    });
  }

  private t(text: LocalizedText): string {
    return text[this.lang()] ?? text.en;
  }
}
