import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

type LangCode = 'ar' | 'en' | 'ur' | 'fr' | 'id' | 'fa' | 'tr' | 'ms';

interface LocalizedText {
  ar: string;
  en: string;
  ur?: string;
  fr?: string;
  id?: string;
  fa?: string;
  tr?: string;
  ms?: string;
}

interface Facility {
  id: string;
  name: LocalizedText;
}

interface Service {
  id: string;
  name: LocalizedText;
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

  protected readonly lang = signal<LangCode>(
    (this.route.snapshot.queryParamMap.get('lang') as LangCode) ?? 'ar',
  );
  protected readonly facilityId =
    this.route.snapshot.queryParamMap.get('facilityId') ?? '1';

  // Mock data — replace with API call keyed by facilityId
  protected readonly facility = signal<Facility>({
    id: this.facilityId,
    name: {
      ar: 'مستشفى الحرم - المدينة المنورة',
      en: 'Al-Haram Hospital - Madinah',
    },
  });

  protected readonly services = signal<Service[]>([
    {
      id: 'emergency',
      name: { ar: 'الطوارئ', en: 'Emergency' },
    },
    {
      id: 'inpatient',
      name: { ar: 'التنويم', en: 'Inpatient' },
    },
  ]);

  protected readonly title = computed(() => this.t(UI_STRINGS.title));
  protected readonly prompt = computed(() => this.t(UI_STRINGS.prompt));
  protected readonly facilityName = computed(() => this.t(this.facility().name));

  protected serviceName(service: Service): string {
    return this.t(service.name);
  }

  protected select(service: Service): void {
    this.router.navigate(['/survey'], {
      queryParams: {
        lang: this.lang(),
        facilityId: this.facilityId,
        service: service.id,
      },
    });
  }

  private t(text: LocalizedText): string {
    return text[this.lang()] ?? text.en;
  }
}
