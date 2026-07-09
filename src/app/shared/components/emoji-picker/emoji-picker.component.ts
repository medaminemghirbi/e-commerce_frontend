import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface EmojiGroup {
  label: string;
  icon: string;
  emojis: string[];
}

const EMOJI_GROUPS: EmojiGroup[] = [
  {
    label: 'Médical',
    icon: '🏥',
    emojis: [
      '🏥','🚑','🩺','💊','💉','🩹','🩻','🔬','🧬','🧪',
      '🩸','🌡️','🦷','🦴','🧠','👁️','👂','🫀','🫁','🩼',
      '⚕️','👨‍⚕️','👩‍⚕️','🧑‍⚕️','🧫','🦠','🧴','🧼','🧤','😷',
      '🤒','🤕','🤧','🥼','🚨','🛏️','🪑','🦯','🩹','💚',
      '❤️','💙','💜','🤍','📋','📑','📈','📉','🗂️','📂'
    ],
  },
  {
    label: 'Nutrition',
    icon: '🥗',
    emojis: [
      '🥗','🥦','🥕','🍎','🍇','🥑','🥝','🌿','🫐','🥜',
      '🍓','🥛','🫚','🌾','🍋','🫒','🥬','🧄','🧅','🫑',
      '🍊','🍌','🍍','🥥','🍉','🍈','🍒','🍑','🥭','🍐',
      '🥒','🌽','🍅','🥔','🍠','🥐','🍞','🥖','🥚','🧀',
      '🐟','🍗','🍖','🥩','🍵','☕','🫖','💧','🥣','🍽️'
    ],
  },
  {
    label: 'Sport',
    icon: '🏃',
    emojis: [
      '🏃','🚴','🧘','🤸','🏊','💪','🎽','🤾','🏄','🧗',
      '⛹️','🤼','🥊','🏋️','🤺','🎯','⚽','🏀','🏐','🎾',
      '🏓','🏸','🥅','🥇','🥈','🥉','🏆','🎖️','🚶','🚶‍♀️',
      '🚶‍♂️','🏃‍♀️','🏃‍♂️','🚵','🚵‍♀️','🚵‍♂️','🛹','🛼','⛷️','🏂',
      '🪂','🤽','🤽‍♀️','🤽‍♂️','🧎','🦵','🦶','❤️','💓','⚡'
    ],
  },
  {
    label: 'Maternité',
    icon: '👶',
    emojis: [
      '👶','🍼','🤱','🧸','🎀','👩‍⚕️','👨‍⚕️','🫄','🧒','👦',
      '👧','🌈','👨‍👩‍👧','👨‍👩‍👦','👩‍👩‍👧','👨‍👨‍👦','🍼','🛏️','🧸','🎈',
      '🎁','❤️','💗','💞','🩷','🧴','🧼','🩺','📅','📋',
      '👣','🧦','🪥','🛁','😴','🌙','☀️','🌸','🐣','🍼',
      '🪀','🧩','🎨','📖','🎵','🎶','🧸','🫶','🤰','👼'
    ],
  },
  {
    label: 'Bien-être',
    icon: '❤️',
    emojis: [
      '❤️','💚','💛','💙','🧡','💜','🤍','🩷','🩵','🩶',
      '🌸','🌺','🌻','☀️','🌙','⭐','✨','🌿','🍃','🧴',
      '🛁','💆','🧖','🧘','🕯️','☁️','🌈','🫶','😊','😌',
      '😇','🥰','😍','🤗','💖','💝','💞','💕','💓','💗',
      '🪷','🍵','☕','🎵','🎶','🕊️','🌼','🌹','🫧','🌱'
    ],
  },
  {
    label: 'Rééducation',
    icon: '🩼',
    emojis: [
      '🩼','🦽','🦼','🦿','🦾','🦵','🦶','💪','🏃','🚶',
      '🧘','🏋️','🤸','🏊','🚴','🩺','🦴','🧠','🫀','🫁',
      '👣','🧎','🛏️','🪑','🦯','⚕️','📈','📋','🎯','🏆',
      '🤲','🫶','💚','❤️','💙','⭐','✨','🌱','🌿','⚡',
      '🔄','🔁','📅','⏱️','🧩','🎽','🥇','🧘‍♀️','🧘‍♂️','🩹'
    ],
  },
  {
    label: 'Soins à domicile',
    icon: '🏠',
    emojis: [
      '🏠','🛏️','🪑','🧴','🧼','🩺','💊','💉','🩹','🩼',
      '🚑','👨‍⚕️','👩‍⚕️','🧑‍⚕️','📋','📅','📞','☎️','📲','🚗',
      '🧹','🪣','🧺','🪥','🚿','🛁','🕯️','❤️','💚','💙',
      '🫶','🤲','🌿','🌸','☀️','🌙','⭐','✨','📦','🛒',
      '🔔','✅','📍','🛡️','⚕️','💧','🥣','🍽️','🧃','🍵'
    ],
  },
  {
    label: 'Général',
    icon: '📦',
    emojis: [
      '📦','📋','🛒','🏠','🔍','⚙️','📊','💬','🔔','💡',
      '🎯','🔗','📁','🗂️','📌','✅','🚀','⚡','🛡️','🌐',
      '📅','📆','⏰','⌛','📝','📄','📑','🖊️','✏️','📍',
      '📞','☎️','📲','💻','🖥️','⌨️','🖨️','📷','📹','🔒',
      '🔓','🔐','🗝️','🧾','💳','💰','📈','📉','📡','☁️'
    ],
  },
];

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-2xl overflow-hidden" style="border:1.5px solid var(--border);background:var(--bg-secondary)">

      <!-- Top bar: preview + clear -->
      <div class="flex items-center gap-3 px-4 py-3" style="border-bottom:1px solid var(--border);background:var(--bg-card)">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style="background:var(--primary-light);border:2px solid var(--primary)">
          {{ value() || '?' }}
        </div>
        <span class="text-sm flex-1" style="color:var(--text-secondary)">
          {{ value() ? 'Icône sélectionnée' : 'Aucune icône sélectionnée' }}
        </span>
        @if (value()) {
          <button type="button" (click)="clear()"
            class="text-xs px-3 py-1.5 rounded-lg font-medium shrink-0"
            style="color:#dc2626;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.2)">
            ✕ Effacer
          </button>
        }
      </div>

      <!-- Category tabs -->
      <div class="flex gap-1 px-3 py-2 overflow-x-auto" style="border-bottom:1px solid var(--border);background:var(--bg-card)">
        @for (group of groups; track group.label) {
          <button type="button"
            (click)="activeGroup.set(group.label)"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
            [style.background]="activeGroup() === group.label ? 'var(--primary)' : 'transparent'"
            [style.color]="activeGroup() === group.label ? 'white' : 'var(--text-secondary)'">
            {{ group.icon }} {{ group.label }}
          </button>
        }
      </div>

      <!-- Emoji grid -->
      <div class="p-3" style="max-height:160px;overflow-y:auto">
        <div class="flex flex-wrap gap-1">
          @for (emoji of activeEmojis(); track emoji) {
            <button type="button" (click)="select(emoji)" [title]="emoji"
              class="w-9 h-9 text-lg rounded-xl transition-all hover:scale-110 flex items-center justify-center"
              [style.background]="value() === emoji ? 'var(--primary)' : 'var(--bg-card)'"
              [style.box-shadow]="value() === emoji ? '0 0 0 2px var(--primary)' : 'none'">
              {{ emoji }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class EmojiPickerComponent {
  readonly value  = input<string>('');
  readonly picked = output<string>();

  protected groups      = EMOJI_GROUPS;
  protected activeGroup = signal(EMOJI_GROUPS[0].label);

  protected activeEmojis = computed(() =>
    this.groups.find(g => g.label === this.activeGroup())?.emojis ?? []
  );

  protected select(emoji: string): void { this.picked.emit(emoji); }
  protected clear(): void { this.picked.emit(''); }
}
