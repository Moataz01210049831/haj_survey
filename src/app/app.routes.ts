import { Routes } from '@angular/router';

import { LanguageSelection } from './pages/language-selection/language-selection';
import { ServiceSelection } from './pages/service-selection/service-selection';
import { Survey } from './pages/survey/survey';

export const routes: Routes = [
  { path: '', component: LanguageSelection, pathMatch: 'full' },
  { path: 'services', component: ServiceSelection },
  { path: 'survey', component: Survey },
  { path: '**', redirectTo: '' },
];
