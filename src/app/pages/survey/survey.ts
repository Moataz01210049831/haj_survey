import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

interface SurveyQuestion {
  id: string;
  text: LocalizedText;
}

const COMMENTS_MAX = 900;

const UI_STRINGS = {
  title: {
    ar: 'استبيان الرضا عن الخدمات الطبية - موسم الحج 2025',
    en: 'Medical Services Satisfaction Survey - Hajj Season 2025',
  },
  comments: {
    ar: 'تعليقات',
    en: 'Comments',
  },
  charactersLeft: {
    ar: 'حرف متبقي',
    en: 'Characters Left',
  },
  submit: {
    ar: 'إرسال',
    en: 'Submit',
  },
} satisfies Record<string, LocalizedText>;

@Component({
  selector: 'app-survey',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './survey.html',
  styleUrl: './survey.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Survey {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly lang = signal<LangCode>(
    (this.route.snapshot.queryParamMap.get('lang') as LangCode) ?? 'ar',
  );
  protected readonly facilityId =
    this.route.snapshot.queryParamMap.get('facilityId') ?? '1';
  protected readonly serviceId =
    this.route.snapshot.queryParamMap.get('service') ?? 'emergency';

  // Mock questions — replace with API call keyed by lang + serviceId
  protected readonly questions = signal<SurveyQuestion[]>([
    {
      id: 'q1',
      text: {
        ar: 'التقييم العام للرعاية الطبية التي تلقيتها أثناء زيارتك',
        en: 'Overall rating of the medical care you received during your visit',
      },
    },
    {
      id: 'q2',
      text: {
        ar: 'سهولة الحصول على الرعاية عند الحاجة',
        en: 'Ease of getting care when needed',
      },
    },
    {
      id: 'q3',
      text: {
        ar: 'فترة الانتظار (من وقت الوصول وحتى المغادرة)',
        en: 'Wait time (from arrival to departure)',
      },
    },
    {
      id: 'q4',
      text: {
        ar: 'سهولة التواصل مع الطاقم الطبي',
        en: 'Ease of communication with medical staff',
      },
    },
    {
      id: 'q5',
      text: {
        ar: 'لطف وحسن تعامل الطاقم الطبي أثناء زيارتك',
        en: 'Courtesy and kindness of medical staff during your visit',
      },
    },
    {
      id: 'q6',
      text: {
        ar: 'مدى حرص الطاقم الطبي على سلامتك (يغسل أيديهم، ارتداء بطاقة التعريف الخاصة بهم، ارتداء الكمامة ... إلخ)',
        en: "Medical staff's care for your safety (washing hands, wearing ID badges, wearing masks, etc.)",
      },
    },
    {
      id: 'q7',
      text: {
        ar: 'نظافة المنشأة',
        en: 'Cleanliness of the facility',
      },
    },
  ]);

  protected readonly ratings = signal<Record<string, number>>({});
  protected readonly comments = signal<string>('');

  protected readonly stars = [1, 2, 3, 4, 5] as const;
  protected readonly maxChars = COMMENTS_MAX;

  protected readonly title = computed(() => this.t(UI_STRINGS.title));
  protected readonly commentsLabel = computed(() => this.t(UI_STRINGS.comments));
  protected readonly charactersLeftLabel = computed(() =>
    this.t(UI_STRINGS.charactersLeft),
  );
  protected readonly submitLabel = computed(() => this.t(UI_STRINGS.submit));

  protected readonly charactersLeft = computed(
    () => this.maxChars - this.comments().length,
  );

  protected readonly canSubmit = computed(() => {
    const r = this.ratings();
    return this.questions().every((q) => r[q.id] > 0);
  });

  protected questionText(q: SurveyQuestion): string {
    return this.t(q.text);
  }

  protected getRating(questionId: string): number {
    return this.ratings()[questionId] ?? 0;
  }

  protected setRating(questionId: string, value: number): void {
    this.ratings.update((r) => ({ ...r, [questionId]: value }));
  }

  protected onCommentsChange(value: string): void {
    this.comments.set(value.slice(0, this.maxChars));
  }

  protected submit(): void {
    if (!this.canSubmit()) return;

    const submission = {
      lang: this.lang(),
      facilityId: this.facilityId,
      serviceId: this.serviceId,
      answers: this.questions().map((q) => ({
        questionId: q.id,
        rating: this.getRating(q.id),
      })),
      comments: this.comments(),
    };

    // TODO: POST to API when backend is ready
    console.log('Survey submission', submission);
    this.router.navigate(['/'], { queryParams: { submitted: '1' } });
  }

  private t(text: LocalizedText): string {
    return text[this.lang()] ?? text.en;
  }
}
