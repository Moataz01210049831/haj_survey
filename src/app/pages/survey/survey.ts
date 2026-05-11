import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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
const TEXT_INPUT_QUESTION_ID = '6e76c4e5-d14b-f111-b855-0050569709c3';
const TEXT_ANSWER_MAX = 200;

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
  submitting: {
    ar: 'جاري الإرسال…',
    en: 'Submitting…',
  },
  submitError: {
    ar: 'فشل إرسال الاستبيان. حاول مرة أخرى',
    en: 'Failed to submit survey. Please try again',
  },
  thankYou: {
    ar: 'شكراً لك',
    en: 'Thank you',
  },
  thankYouSubtitle: {
    ar: 'تم إرسال استبيانك بنجاح',
    en: 'Your survey has been submitted successfully',
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
  private readonly entryService = inject(SurveyEntryService);

  protected readonly lang = signal<LangCode>(
    (this.route.snapshot.queryParamMap.get('lang') as LangCode) ?? 'ar',
  );
  protected readonly languageId =
    this.route.snapshot.queryParamMap.get('languageId') ?? '';
  protected readonly facilityId =
    this.route.snapshot.queryParamMap.get('facilityId') ?? '';
  protected readonly facilityTypeId =
    this.route.snapshot.queryParamMap.get('facilityTypeId') ?? '';
  protected readonly serviceId =
    this.route.snapshot.queryParamMap.get('service') ?? '';

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
    this.loadQuestions();
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
    return questionId === TEXT_INPUT_QUESTION_ID;
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
      FacilityId: this.facilityId,
      ClassificationId: this.serviceId,
      LanguageId: this.languageId,
      QuestionAnswers: this.questions()
        .map((q) => {
          if (this.isTextQuestion(q.id)) {
            const value = (t[q.id] ?? '').trim();
            return value ? { QuestionId: q.id, AnswerValue: value } : null;
          }
          return r[q.id] > 0
            ? { QuestionId: q.id, AnswerValue: String(r[q.id]) }
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
