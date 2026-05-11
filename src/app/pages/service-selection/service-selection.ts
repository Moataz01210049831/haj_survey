import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { LanguagePicker } from '../../components/language-picker/language-picker';
import { LookupsService } from '../../services/lookups';

type LangCode = 'ar' | 'en' | 'fa' | 'fr' | 'in' | 'tr' | 'ml' | 'ur' | 'hi';

interface LocalizedText {
  ar: string;
  en: string;
  fa?: string;
  fr?: string;
  in?: string;
  tr?: string;
  ml?: string;
  ur?: string;
  hi?: string;
}

interface Service {
  id: string;
  name: string;
}

const UI_STRINGS = {
  title: {
    ar: 'استبيان الرضا عن الخدمات الطبية - موسم الحج 2026',
    en: 'Medical Services Satisfaction Survey - Hajj Season 2026',
    fa: 'نظرسنجی رضایت از خدمات پزشکی - فصل حج ۲۰۲۶',
    fr: 'Enquête de satisfaction des services médicaux - Saison du Hajj 2026',
    in: 'Survei Kepuasan Layanan Medis - Musim Haji 2026',
    tr: 'Tıbbi Hizmetler Memnuniyet Anketi - Hac Sezonu 2026',
    ml: 'Tinjauan Kepuasan Perkhidmatan Perubatan - Musim Haji 2026',
    ur: 'طبی خدمات کا اطمینان سروے - حج 2026',
    hi: 'चिकित्सा सेवा संतुष्टि सर्वेक्षण - हज सीज़न 2026',
  },
  prompt: {
    ar: 'الرجاء اختيار الخدمة التي تلقيتها',
    en: 'Please select the service you received',
    fa: 'لطفاً خدمتی را که دریافت کردید انتخاب کنید',
    fr: 'Veuillez sélectionner le service que vous avez reçu',
    in: 'Silakan pilih layanan yang Anda terima',
    tr: 'Lütfen aldığınız hizmeti seçin',
    ml: 'Sila pilih perkhidmatan yang anda terima',
    ur: 'براہ کرم وہ خدمت منتخب کریں جو آپ کو موصول ہوئی',
    hi: 'कृपया वह सेवा चुनें जो आपको प्राप्त हुई',
  },
  loading: {
    ar: 'جاري تحميل الخدمات…',
    en: 'Loading services…',
    fa: 'در حال بارگیری خدمات…',
    fr: 'Chargement des services…',
    in: 'Memuat layanan…',
    tr: 'Hizmetler yükleniyor…',
    ml: 'Memuatkan perkhidmatan…',
    ur: 'خدمات لوڈ ہو رہی ہیں…',
    hi: 'सेवाएं लोड हो रही हैं…',
  },
  errorLoading: {
    ar: 'فشل تحميل الخدمات',
    en: 'Failed to load services',
    fa: 'بارگیری خدمات ناموفق بود',
    fr: 'Échec du chargement des services',
    in: 'Gagal memuat layanan',
    tr: 'Hizmetler yüklenemedi',
    ml: 'Gagal memuatkan perkhidmatan',
    ur: 'خدمات لوڈ کرنے میں ناکام',
    hi: 'सेवाएं लोड करने में विफल',
  },
  retry: {
    ar: 'إعادة المحاولة',
    en: 'Retry',
    fa: 'تلاش مجدد',
    fr: 'Réessayer',
    in: 'Coba lagi',
    tr: 'Tekrar dene',
    ml: 'Cuba semula',
    ur: 'دوبارہ کوشش کریں',
    hi: 'पुनः प्रयास करें',
  },
} satisfies Record<string, LocalizedText>;

@Component({
  selector: 'app-service-selection',
  standalone: true,
  imports: [LanguagePicker],
  templateUrl: './service-selection.html',
  styleUrl: './service-selection.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceSelection {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lookups = inject(LookupsService);

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly lang = computed<LangCode>(
    () => (this.params().get('lang') as LangCode) ?? 'ar',
  );
  protected readonly languageId = computed(() => this.params().get('languageId') ?? '');
  protected readonly facilityId = computed(() => this.params().get('facilityId') ?? '');
  protected readonly facilityTypeId = computed(
    () => this.params().get('facilityTypeId') ?? '',
  );

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
    effect(() => {
      this.lang();
      this.facilityId();
      this.loadServices();
      this.loadFacility();
    });
  }

  protected select(service: Service): void {
    this.router.navigate(['/survey'], {
      queryParams: {
        lang: this.lang(),
        languageId: this.languageId(),
        facilityId: this.facilityId(),
        facilityTypeId: this.facilityTypeId(),
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

    this.lookups.getClassifications(this.facilityId(), this.lang()).subscribe({
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
    const id = this.facilityId();
    if (!id) return;

    this.lookups.getFacility(id, this.lang()).subscribe({
      next: (facility) => {
        if (facility) this.facilityName.set(facility.name);
      },
    });
  }

  private t(text: LocalizedText): string {
    return text[this.lang()] ?? text.en;
  }
}
