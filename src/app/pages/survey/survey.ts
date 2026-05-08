import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

interface SurveyQuestion {
  id: string;
  text: string;
}

const COMMENTS_MAX = 900;

const UI_STRINGS = {
  title: {
    ar: 'استبيان الرضا عن الخدمات الطبية - موسم الحج 2026',
    en: 'Medical Services Satisfaction Survey - Hajj Season 2026',
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
  loading: {
    ar: 'جاري تحميل الأسئلة…',
    en: 'Loading questions…',
  },
  errorLoading: {
    ar: 'فشل تحميل الأسئلة',
    en: 'Failed to load questions',
  },
  retry: {
    ar: 'إعادة المحاولة',
    en: 'Retry',
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
  private readonly lookups = inject(LookupsService);

  protected readonly lang = signal<LangCode>(
    (this.route.snapshot.queryParamMap.get('lang') as LangCode) ?? 'ar',
  );
  protected readonly facilityId =
    this.route.snapshot.queryParamMap.get('facilityId') ?? '';
  protected readonly facilityTypeId =
    this.route.snapshot.queryParamMap.get('facilityTypeId') ?? '';
  protected readonly serviceId =
    this.route.snapshot.queryParamMap.get('service') ?? '';

  protected readonly questions = signal<SurveyQuestion[]>([]);
  protected readonly loading = signal<boolean>(true);
  protected readonly loadError = signal<boolean>(false);

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
  protected readonly loadingLabel = computed(() => this.t(UI_STRINGS.loading));
  protected readonly errorLabel = computed(() => this.t(UI_STRINGS.errorLoading));
  protected readonly retryLabel = computed(() => this.t(UI_STRINGS.retry));

  protected readonly charactersLeft = computed(
    () => this.maxChars - this.comments().length,
  );

  protected readonly canSubmit = computed(() => {
    const r = this.ratings();
    const qs = this.questions();
    return qs.length > 0 && qs.every((q) => r[q.id] > 0);
  });

  constructor() {
    this.loadQuestions();
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

  protected retry(): void {
    this.loadQuestions();
  }

  protected submit(): void {
    if (!this.canSubmit()) return;

    const submission = {
      lang: this.lang(),
      facilityId: this.facilityId,
      facilityTypeId: this.facilityTypeId,
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

  private loadQuestions(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.lookups
      .getQuestions(this.serviceId, this.facilityTypeId, this.lang())
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
