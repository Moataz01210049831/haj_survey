import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { LanguagePicker } from '../../components/language-picker/language-picker';
import { LookupsService } from '../../services/lookups';
import { SurveyEntryService } from '../../services/survey-entry';

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

interface SurveyQuestion {
  id: string;
  text: string;
}

const COMMENTS_MAX = 900;
const TEXT_INPUT_QUESTION_IDS = new Set<string>([
  '5a3726c2-d14b-f111-b855-0050569709c3',
  'c9ce82d8-d14b-f111-b855-0050569709c3',
  '6e76c4e5-d14b-f111-b855-0050569709c3',
  '6f76c4e5-d14b-f111-b855-0050569709c3',
  '3d4c96f2-d14b-f111-b855-0050569709c3',
  '3e4c96f2-d14b-f111-b855-0050569709c3',
]);
const TEXT_ANSWER_MAX = 200;

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
  comments: {
    ar: 'تعليقات',
    en: 'Comments',
    fa: 'نظرات',
    fr: 'Commentaires',
    in: 'Komentar',
    tr: 'Yorumlar',
    ml: 'Komen',
    ur: 'تبصرے',
    hi: 'टिप्पणियाँ',
  },
  charactersLeft: {
    ar: 'حرف متبقي',
    en: 'Characters Left',
    fa: 'کاراکترهای باقی‌مانده',
    fr: 'Caractères restants',
    in: 'Karakter Tersisa',
    tr: 'Kalan Karakter',
    ml: 'Aksara Berbaki',
    ur: 'باقی حروف',
    hi: 'शेष अक्षर',
  },
  submit: {
    ar: 'إرسال',
    en: 'Submit',
    fa: 'ارسال',
    fr: 'Envoyer',
    in: 'Kirim',
    tr: 'Gönder',
    ml: 'Hantar',
    ur: 'جمع کرائیں',
    hi: 'सबमिट करें',
  },
  submitting: {
    ar: 'جاري الإرسال…',
    en: 'Submitting…',
    fa: 'در حال ارسال…',
    fr: 'Envoi en cours…',
    in: 'Mengirim…',
    tr: 'Gönderiliyor…',
    ml: 'Menghantar…',
    ur: 'جمع کرایا جا رہا ہے…',
    hi: 'सबमिट हो रहा है…',
  },
  submitError: {
    ar: 'فشل إرسال الاستبيان. حاول مرة أخرى',
    en: 'Failed to submit survey. Please try again',
    fa: 'ارسال نظرسنجی ناموفق بود. لطفاً دوباره تلاش کنید',
    fr: 'Échec de l’envoi du sondage. Veuillez réessayer',
    in: 'Gagal mengirim survei. Silakan coba lagi',
    tr: 'Anket gönderilemedi. Lütfen tekrar deneyin',
    ml: 'Gagal menghantar tinjauan. Sila cuba lagi',
    ur: 'سروے جمع کرانے میں ناکام۔ دوبارہ کوشش کریں',
    hi: 'सर्वेक्षण सबमिट करने में विफल। कृपया पुनः प्रयास करें',
  },
  thankYou: {
    ar: 'شكراً لك',
    en: 'Thank you',
    fa: 'متشکریم',
    fr: 'Merci',
    in: 'Terima kasih',
    tr: 'Teşekkür ederiz',
    ml: 'Terima kasih',
    ur: 'آپ کا شکریہ',
    hi: 'धन्यवाद',
  },
  thankYouSubtitle: {
    ar: 'تم إرسال استبيانك بنجاح',
    en: 'Your survey has been submitted successfully',
    fa: 'نظرسنجی شما با موفقیت ارسال شد',
    fr: 'Votre sondage a été envoyé avec succès',
    in: 'Survei Anda berhasil dikirim',
    tr: 'Anketiniz başarıyla gönderildi',
    ml: 'Tinjauan anda telah berjaya dihantar',
    ur: 'آپ کا سروے کامیابی کے ساتھ جمع کرا دیا گیا ہے',
    hi: 'आपका सर्वेक्षण सफलतापूर्वक सबमिट कर दिया गया है',
  },
  loading: {
    ar: 'جاري تحميل الأسئلة…',
    en: 'Loading questions…',
    fa: 'در حال بارگیری سؤالات…',
    fr: 'Chargement des questions…',
    in: 'Memuat pertanyaan…',
    tr: 'Sorular yükleniyor…',
    ml: 'Memuatkan soalan…',
    ur: 'سوالات لوڈ ہو رہے ہیں…',
    hi: 'प्रश्न लोड हो रहे हैं…',
  },
  errorLoading: {
    ar: 'فشل تحميل الأسئلة',
    en: 'Failed to load questions',
    fa: 'بارگیری سؤالات ناموفق بود',
    fr: 'Échec du chargement des questions',
    in: 'Gagal memuat pertanyaan',
    tr: 'Sorular yüklenemedi',
    ml: 'Gagal memuatkan soalan',
    ur: 'سوالات لوڈ کرنے میں ناکام',
    hi: 'प्रश्न लोड करने में विफल',
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
  selector: 'app-survey',
  standalone: true,
  imports: [FormsModule, LanguagePicker],
  templateUrl: './survey.html',
  styleUrl: './survey.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Survey {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lookups = inject(LookupsService);
  private readonly entryService = inject(SurveyEntryService);

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
  protected readonly serviceId = computed(() => this.params().get('service') ?? '');

  protected readonly questions = signal<SurveyQuestion[]>([]);
  protected readonly loading = signal<boolean>(true);
  protected readonly loadError = signal<boolean>(false);
  protected readonly submitting = signal<boolean>(false);
  protected readonly submitError = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);

  protected readonly ratings = signal<Record<string, number>>({});
  protected readonly textAnswers = signal<Record<string, string>>({});
  protected readonly comments = signal<string>('');

  protected readonly stars = [1, 2, 3, 4, 5] as const;
  protected readonly maxChars = COMMENTS_MAX;
  protected readonly textAnswerMax = TEXT_ANSWER_MAX;

  protected readonly title = computed(() => this.t(UI_STRINGS.title));
  protected readonly commentsLabel = computed(() => this.t(UI_STRINGS.comments));
  protected readonly charactersLeftLabel = computed(() =>
    this.t(UI_STRINGS.charactersLeft),
  );
  protected readonly submitLabel = computed(() =>
    this.submitting() ? this.t(UI_STRINGS.submitting) : this.t(UI_STRINGS.submit),
  );
  protected readonly submitErrorLabel = computed(() => this.t(UI_STRINGS.submitError));
  protected readonly thankYouLabel = computed(() => this.t(UI_STRINGS.thankYou));
  protected readonly thankYouSubtitleLabel = computed(() =>
    this.t(UI_STRINGS.thankYouSubtitle),
  );
  protected readonly loadingLabel = computed(() => this.t(UI_STRINGS.loading));
  protected readonly errorLabel = computed(() => this.t(UI_STRINGS.errorLoading));
  protected readonly retryLabel = computed(() => this.t(UI_STRINGS.retry));

  protected readonly charactersLeft = computed(
    () => this.maxChars - this.comments().length,
  );

  protected readonly canSubmit = computed(() => {
    const r = this.ratings();
    const t = this.textAnswers();
    const qs = this.questions();
    return (
      qs.length > 0 &&
      qs.some((q) =>
        this.isTextQuestion(q.id) ? (t[q.id] ?? '').trim().length > 0 : r[q.id] > 0,
      )
    );
  });

  constructor() {
    effect(() => {
      this.lang();
      this.serviceId();
      this.facilityTypeId();
      this.loadQuestions();
    });
  }

  protected getRating(questionId: string): number {
    return this.ratings()[questionId] ?? 0;
  }

  protected setRating(questionId: string, value: number): void {
    this.ratings.update((r) => ({
      ...r,
      [questionId]: r[questionId] === value ? 0 : value,
    }));
  }

  protected isTextQuestion(questionId: string): boolean {
    return TEXT_INPUT_QUESTION_IDS.has(questionId);
  }

  protected getTextAnswer(questionId: string): string {
    return this.textAnswers()[questionId] ?? '';
  }

  protected setTextAnswer(questionId: string, value: string): void {
    const next = value.slice(0, TEXT_ANSWER_MAX);
    this.textAnswers.update((t) => ({ ...t, [questionId]: next }));
  }

  protected onCommentsChange(value: string): void {
    this.comments.set(value.slice(0, this.maxChars));
  }

  protected retry(): void {
    this.loadQuestions();
  }

  protected submit(): void {
    if (!this.canSubmit() || this.submitting()) return;

    const r = this.ratings();
    const t = this.textAnswers();
    const payload = {
      FacilityId: this.facilityId(),
      ClassificationId: this.serviceId(),
      LanguageId: this.languageId(),
      QuestionAnswers: this.questions()
        .map((q) => {
          if (this.isTextQuestion(q.id)) {
            const value = (t[q.id] ?? '').trim();
            return value ? { QuestionId: q.id, AnswerValue: value } : null;
          }
          return r[q.id] > 0
            ? { QuestionId: q.id, AnswerValue: String((r[q.id] - 1) * 25) }
            : null;
        })
        .filter((a): a is { QuestionId: string; AnswerValue: string } => a !== null),
      Notes: this.comments(),
    };

    this.submitting.set(true);
    this.submitError.set(false);

    this.entryService.submit(payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.Success === false) {
          console.error('[survey] Submit returned Success=false', res);
          this.submitError.set(true);
          return;
        }
        this.submitted.set(true);
      },
      error: (err) => {
        console.error('[survey] Submit failed', err);
        this.submitting.set(false);
        this.submitError.set(true);
      },
    });
  }

  private loadQuestions(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.lookups
      .getQuestions(this.serviceId(), this.facilityTypeId(), this.lang())
      .subscribe({
        next: (items) => {
          this.questions.set(items.map((item) => ({ id: item.id, text: item.name })));
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[survey] Question fetch failed', err);
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
  }

  private t(text: LocalizedText): string {
    return text[this.lang()] ?? text.en;
  }
}
