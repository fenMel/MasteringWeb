import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-voir-decision',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voir-decision.component.html',
  styleUrls: ['./voir-decision.component.scss']
})
export class VoirDecisionComponent {
  @Input() evaluationResults: any[] = [];
  @Input() setSousMenu: any;
}
