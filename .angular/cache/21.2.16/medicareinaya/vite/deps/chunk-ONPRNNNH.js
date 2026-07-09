import {
  outputToObservable
} from "./chunk-KPUJH3UM.js";
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  input,
  numberAttribute,
  output,
  setClassMetadata,
  ɵɵHostDirectivesFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdomElement,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵstyleProp
} from "./chunk-P3OHJKS6.js";
import {
  InjectionToken,
  computed,
  effect,
  inject,
  signal,
  untracked
} from "./chunk-RBEGZ7DM.js";
import {
  BehaviorSubject,
  EMPTY,
  delay,
  filter,
  finalize,
  of,
  switchMap,
  takeUntil,
  tap,
  timer
} from "./chunk-MARUHEWW.js";
import {
  __spreadValues
} from "./chunk-HFBNPKKE.js";

// node_modules/ngx-progressbar/fesm2022/ngx-progressbar.mjs
function NgProgressbar_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵdomElement(0, "div", 3);
  }
}
function NgProgressbar_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵdomElementStart(0, "div", 4);
    ɵɵdomElement(1, "div", 5);
    ɵɵdomElementEnd();
  }
}
var defaultOptions = {
  min: 8,
  max: 100,
  speed: 200,
  debounceTime: 0,
  trickleSpeed: 300,
  fadeOutSpeed: 50,
  relative: false,
  flat: false,
  spinner: false,
  direction: "ltr+",
  spinnerPosition: "right",
  trickleFunc: (n) => {
    if (n >= 0 && n < 20) {
      return 10;
    }
    if (n >= 20 && n < 50) {
      return 4;
    }
    if (n >= 50 && n < 80) {
      return 2;
    }
    if (n >= 80 && n < 99) {
      return 0.5;
    }
    return 0;
  }
};
var NG_PROGRESS_OPTIONS = new InjectionToken("NG_PROGRESS_OPTIONS", {
  providedIn: "root",
  factory: () => defaultOptions
});
function provideNgProgressOptions(options) {
  return {
    provide: NG_PROGRESS_OPTIONS,
    useValue: __spreadValues(__spreadValues({}, defaultOptions), options)
  };
}
var TriggerType;
(function(TriggerType2) {
  TriggerType2["START"] = "START";
  TriggerType2["COMPLETE"] = "COMPLETE";
})(TriggerType || (TriggerType = {}));
function minAttribute(value) {
  const min = numberAttribute(value) || 0;
  return min < 100 && min >= 0 ? min : 0;
}
function maxAttribute(value) {
  const max = numberAttribute(value) || 100;
  return max > 0 && max <= 100 ? max : 100;
}
var NgProgressRef = class _NgProgressRef {
  constructor() {
    this.defaultOptions = inject(NG_PROGRESS_OPTIONS);
    this.min = input(this.defaultOptions.min, {
      transform: minAttribute
    });
    this.max = input(this.defaultOptions.max, {
      transform: maxAttribute
    });
    this.speed = input(this.defaultOptions.speed, {
      transform: numberAttribute
    });
    this.trickleSpeed = input(this.defaultOptions.trickleSpeed, {
      transform: numberAttribute
    });
    this.fadeOutSpeed = input(this.defaultOptions.fadeOutSpeed, {
      transform: numberAttribute
    });
    this.debounceTime = input(this.defaultOptions.debounceTime, {
      transform: numberAttribute
    });
    this.trickleFunc = input(this.defaultOptions.trickleFunc);
    this.config = computed(() => {
      return {
        max: this.max(),
        min: this.min(),
        speed: this.speed(),
        trickleSpeed: this.trickleSpeed(),
        fadeOutSpeed: this.fadeOutSpeed(),
        trickleFunc: this.trickleFunc(),
        debounceTime: this.debounceTime()
      };
    });
    this._progress = signal(0);
    this._active = signal(false);
    this.active = computed(() => this._active());
    this.progress = computed(() => this._progress());
    this.started = output();
    this.completed = output();
    this._trigger = new BehaviorSubject(null);
    let sub$;
    effect((onCleanup) => {
      const config = this.config();
      untracked(() => {
        sub$ = this._trigger.pipe(filter((trigger) => !!trigger), switchMap((trigger) => {
          if (trigger === TriggerType.START) {
            return timer(config.debounceTime).pipe(switchMap(() => this.onTrickling(config)));
          }
          return this.onComplete(config);
        })).subscribe();
        onCleanup(() => sub$?.unsubscribe());
      });
    });
  }
  /**
   * Start the progress
   */
  start() {
    this.started.emit();
    this._trigger.next(TriggerType.START);
    this._active.set(true);
  }
  /**
   * Complete the progress
   */
  complete() {
    this._trigger.next(TriggerType.COMPLETE);
  }
  /**
   * Increment the progress
   */
  inc(amount) {
    const n = this.progress();
    if (!this.active()) {
      this.start();
    } else {
      if (typeof amount !== "number") {
        amount = this.config().trickleFunc(n);
      }
      this.set(n + amount);
    }
  }
  /**
   * Set the progress
   */
  set(n) {
    this._active.set(true);
    this._progress.set(this.clamp(n));
  }
  /**
   * Clamps a value to be between min and max
   */
  clamp(n) {
    return Math.max(this.config().min, Math.min(this.config().max, n));
  }
  /**
   * Keeps incrementing the progress
   */
  onTrickling(config) {
    if (!this.active()) {
      this.set(config.min);
    }
    return timer(0, config.trickleSpeed).pipe(tap(() => this.inc()));
  }
  /**
   * Completes then resets the progress
   */
  onComplete(config) {
    if (!this.active()) {
      return EMPTY;
    }
    this.completed.emit();
    return of({}).pipe(
      // Complete the progress
      tap(() => this._progress.set(100)),
      // Deactivate the progress after a tiny delay
      delay(config.speed + 140),
      tap(() => this._active.set(false)),
      // Use a tiny delay before resetting
      delay(config.fadeOutSpeed),
      // Force the progress to reset even it got cancelled
      finalize(() => this._progress.set(0)),
      // Cancel any of the finalizing delays if the progress has started again
      takeUntil(outputToObservable(this.started))
    );
  }
  static {
    this.ɵfac = function NgProgressRef_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _NgProgressRef)();
    };
  }
  static {
    this.ɵdir = ɵɵdefineDirective({
      type: _NgProgressRef,
      selectors: [["", "ngProgressRef", ""]],
      inputs: {
        min: [1, "min"],
        max: [1, "max"],
        speed: [1, "speed"],
        trickleSpeed: [1, "trickleSpeed"],
        fadeOutSpeed: [1, "fadeOutSpeed"],
        debounceTime: [1, "debounceTime"],
        trickleFunc: [1, "trickleFunc"]
      },
      outputs: {
        started: "started",
        completed: "completed"
      },
      exportAs: ["ngProgressRef"]
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgProgressRef, [{
    type: Directive,
    args: [{
      standalone: true,
      selector: "[ngProgressRef]",
      exportAs: "ngProgressRef"
    }]
  }], () => [], null);
})();
var NgProgressbar = class _NgProgressbar {
  constructor() {
    this.config = inject(NG_PROGRESS_OPTIONS);
    this.progressRef = inject(NgProgressRef, {
      host: true,
      self: true
    });
    this.flat = input(this.config.flat, {
      transform: booleanAttribute
    });
    this.spinner = input(this.config.spinner, {
      transform: booleanAttribute
    });
    this.relative = input(this.config.relative, {
      transform: booleanAttribute
    });
    this.spinnerPosition = input(this.config.spinnerPosition);
    this.direction = input(this.config.direction);
    this.progressTransform = computed(() => {
      return `translate3d(${this.progressRef.progress()}%,0,0)`;
    });
  }
  static {
    this.ɵfac = function NgProgressbar_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _NgProgressbar)();
    };
  }
  static {
    this.ɵcmp = ɵɵdefineComponent({
      type: _NgProgressbar,
      selectors: [["ng-progress"]],
      hostAttrs: ["role", "progressbar"],
      hostVars: 12,
      hostBindings: function NgProgressbar_HostBindings(rf, ctx) {
        if (rf & 2) {
          ɵɵattribute("spinnerPosition", ctx.spinnerPosition())("direction", ctx.direction());
          ɵɵstyleProp("--_ng-progress-speed", ctx.progressRef.speed() + "ms")("--_ng-progress-fade-out-speed", ctx.progressRef.fadeOutSpeed() + "ms");
          ɵɵclassProp("ng-progress-bar", true)("ng-progress-bar-active", ctx.progressRef.active())("ng-progress-bar-relative", ctx.relative());
        }
      },
      inputs: {
        flat: [1, "flat"],
        spinner: [1, "spinner"],
        relative: [1, "relative"],
        spinnerPosition: [1, "spinnerPosition"],
        direction: [1, "direction"]
      },
      exportAs: ["ngProgress"],
      features: [ɵɵHostDirectivesFeature([{
        directive: NgProgressRef,
        inputs: ["min", "min", "max", "max", "speed", "speed", "trickleSpeed", "trickleSpeed", "fadeOutSpeed", "fadeOutSpeed", "debounceTime", "debounceTime"],
        outputs: ["started", "started", "completed", "completed"]
      }])],
      decls: 5,
      vars: 4,
      consts: [[1, "ng-progress-bar-wrapper"], [1, "ng-bar-placeholder"], [1, "ng-bar"], [1, "ng-meteor"], [1, "ng-spinner"], [1, "ng-spinner-icon"]],
      template: function NgProgressbar_Template(rf, ctx) {
        if (rf & 1) {
          ɵɵdomElementStart(0, "div", 0)(1, "div", 1)(2, "div", 2);
          ɵɵconditionalCreate(3, NgProgressbar_Conditional_3_Template, 1, 0, "div", 3);
          ɵɵdomElementEnd()();
          ɵɵconditionalCreate(4, NgProgressbar_Conditional_4_Template, 2, 0, "div", 4);
          ɵɵdomElementEnd();
        }
        if (rf & 2) {
          ɵɵadvance(2);
          ɵɵstyleProp("transform", ctx.progressTransform());
          ɵɵadvance();
          ɵɵconditional(!ctx.flat() ? 3 : -1);
          ɵɵadvance();
          ɵɵconditional(ctx.spinner() ? 4 : -1);
        }
      },
      styles: ['[_nghost-%COMP%]{--_ng-progress-thickness: var(--ng-progress-thickness, 2);--_ng-progress-thickness-px: calc(var(--_ng-progress-thickness) * 1px);--_ng-progress-thickness-add-one: calc(var(--_ng-progress-thickness) + 1);--_ng-progress-meteor-position-px: calc(var(--_ng-progress-thickness-add-one) * -1px);--_ng-progress-color: var(--ng-progress-color, #1B95E0);--_ng-progress-holder-color: var(--ng-progress-holder-color, transparent);--_ng-progress-ease: var(--ng-progress-ease, linear);--_ng-progress-spinner-thickness: var(--ng-progress-spinner-thickness, 2);--_ng-progress-spinner-thickness-px: calc(var(--_ng-progress-spinner-thickness) * 1px);--_ng-progress-spinner-spacing: var(--ng-progress-spinner-spacing, 15);--_ng-progress-spinner-spacing-px: calc(var(--_ng-progress-spinner-spacing) * 1px);--_ng-progress-spinner-size: var(--ng-progress-spinner-size, 18);--_ng-progress-spinner-size-px: calc(var(--_ng-progress-spinner-size) * 1px);--_ng-progress-spinner-speed: var(--ng-progress-spinner-speed, .25s);z-index:999999;pointer-events:none}.ng-progress-bar-active[_nghost-%COMP%]   .ng-progress-bar-wrapper[_ngcontent-%COMP%]{filter:alpha(opacity=100);opacity:1;transition:none}.ng-progress-bar-active[_nghost-%COMP%]   .ng-bar[_ngcontent-%COMP%]{transition:all var(--_ng-progress-speed) var(--_ng-progress-ease)}.ng-progress-bar-relative[_nghost-%COMP%]   .ng-progress-bar-wrapper[_ngcontent-%COMP%]{position:relative}[direction="ltr+"][_nghost-%COMP%]   .ng-meteor[_ngcontent-%COMP%], [direction=ltr-][_nghost-%COMP%]   .ng-meteor[_ngcontent-%COMP%]{rotate:calc(var(--_ng-progress-thickness-add-one) * 1deg)}[direction="ltr+"][_nghost-%COMP%]   .ng-bar[_ngcontent-%COMP%], [direction="rtl+"][_nghost-%COMP%]   .ng-bar[_ngcontent-%COMP%]{margin-left:-100%}[direction="ltr+"][_nghost-%COMP%]   .ng-meteor[_ngcontent-%COMP%], [direction="rtl+"][_nghost-%COMP%]   .ng-meteor[_ngcontent-%COMP%]{right:0}[direction="ltr+"][_nghost-%COMP%]   .ng-meteor[_ngcontent-%COMP%], [direction=rtl-][_nghost-%COMP%]   .ng-meteor[_ngcontent-%COMP%]{top:var(--_ng-progress-meteor-position-px)}[direction=ltr-][_nghost-%COMP%]   .ng-meteor[_ngcontent-%COMP%], [direction="rtl+"][_nghost-%COMP%]   .ng-meteor[_ngcontent-%COMP%]{bottom:var(--_ng-progress-meteor-position-px)}[direction=ltr-][_nghost-%COMP%]   .ng-bar-placeholder[_ngcontent-%COMP%], [direction="rtl+"][_nghost-%COMP%]   .ng-bar-placeholder[_ngcontent-%COMP%]{transform:rotate(180deg)}[direction=ltr-][_nghost-%COMP%]   .ng-spinner-icon[_ngcontent-%COMP%], [direction="rtl+"][_nghost-%COMP%]   .ng-spinner-icon[_ngcontent-%COMP%]{animation-direction:reverse}[direction="rtl+"][_nghost-%COMP%]   .ng-meteor[_ngcontent-%COMP%], [direction=rtl-][_nghost-%COMP%]   .ng-meteor[_ngcontent-%COMP%]{rotate:calc(var(--_ng-progress-thickness-add-one) * -1deg)}[_nghost-%COMP%]   .ng-spinner[_ngcontent-%COMP%]{top:var(--_ng-progress-spinner-spacing-px)}[spinnerPosition=left][_nghost-%COMP%]   .ng-spinner[_ngcontent-%COMP%]{left:var(--_ng-progress-spinner-spacing-px)}[spinnerPosition=right][_nghost-%COMP%]   .ng-spinner[_ngcontent-%COMP%]{right:var(--_ng-progress-spinner-spacing-px)}.ng-progress-bar-wrapper[_ngcontent-%COMP%]{position:fixed;z-index:999999;top:0;left:0;width:100%;transform:scale(1);filter:alpha(opacity=0);opacity:0;transition:opacity var(--_ng-progress-fade-out-speed) linear}.ng-bar-placeholder[_ngcontent-%COMP%]{position:absolute;height:var(--_ng-progress-thickness-px);width:100%}.ng-bar[_ngcontent-%COMP%]{width:100%;height:100%;transform:translate(-100%,0,0);background:var(--_ng-progress-color)}.ng-meteor[_ngcontent-%COMP%]{display:block;position:absolute;width:100px;height:100%;opacity:1;box-shadow:0 0 10px var(--_ng-progress-color),0 0 5px var(--_ng-progress-color)}.ng-spinner[_ngcontent-%COMP%]{position:absolute;display:block;z-index:1031;top:10px}.ng-spinner-icon[_ngcontent-%COMP%]{box-sizing:border-box;animation:_ngcontent-%COMP%_spinner-animation var(--_ng-progress-spinner-speed) linear infinite;border-style:solid;border-color:transparent;border-radius:50%;border-top-color:var(--_ng-progress-color);border-left-color:var(--_ng-progress-color);width:var(--_ng-progress-spinner-size-px);height:var(--_ng-progress-spinner-size-px);border-width:var(--_ng-progress-spinner-thickness-px)}@keyframes _ngcontent-%COMP%_spinner-animation{0%{transform:rotate(0)}to{transform:rotate(360deg)}}'],
      changeDetection: 0
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgProgressbar, [{
    type: Component,
    args: [{
      standalone: true,
      selector: "ng-progress",
      exportAs: "ngProgress",
      host: {
        "role": "progressbar",
        "[class.ng-progress-bar]": "true",
        "[class.ng-progress-bar-active]": "progressRef.active()",
        "[class.ng-progress-bar-relative]": "relative()",
        "[attr.spinnerPosition]": "spinnerPosition()",
        "[attr.direction]": "direction()",
        "[style.--_ng-progress-speed]": 'progressRef.speed() + "ms"',
        "[style.--_ng-progress-fade-out-speed]": 'progressRef.fadeOutSpeed() + "ms"'
      },
      hostDirectives: [{
        directive: NgProgressRef,
        inputs: ["min", "max", "speed", "trickleSpeed", "fadeOutSpeed", "debounceTime"],
        outputs: ["started", "completed"]
      }],
      template: `
    <div class="ng-progress-bar-wrapper">
      <div class="ng-bar-placeholder">
        <div class="ng-bar" [style.transform]="progressTransform()">
          @if (!flat()) {
            <div class="ng-meteor"></div>
          }
        </div>
      </div>
      @if (spinner()) {
        <div class="ng-spinner">
          <div class="ng-spinner-icon"></div>
        </div>
      }
    </div>
  `,
      changeDetection: ChangeDetectionStrategy.OnPush,
      styles: [':host{--_ng-progress-thickness: var(--ng-progress-thickness, 2);--_ng-progress-thickness-px: calc(var(--_ng-progress-thickness) * 1px);--_ng-progress-thickness-add-one: calc(var(--_ng-progress-thickness) + 1);--_ng-progress-meteor-position-px: calc(var(--_ng-progress-thickness-add-one) * -1px);--_ng-progress-color: var(--ng-progress-color, #1B95E0);--_ng-progress-holder-color: var(--ng-progress-holder-color, transparent);--_ng-progress-ease: var(--ng-progress-ease, linear);--_ng-progress-spinner-thickness: var(--ng-progress-spinner-thickness, 2);--_ng-progress-spinner-thickness-px: calc(var(--_ng-progress-spinner-thickness) * 1px);--_ng-progress-spinner-spacing: var(--ng-progress-spinner-spacing, 15);--_ng-progress-spinner-spacing-px: calc(var(--_ng-progress-spinner-spacing) * 1px);--_ng-progress-spinner-size: var(--ng-progress-spinner-size, 18);--_ng-progress-spinner-size-px: calc(var(--_ng-progress-spinner-size) * 1px);--_ng-progress-spinner-speed: var(--ng-progress-spinner-speed, .25s);z-index:999999;pointer-events:none}:host.ng-progress-bar-active .ng-progress-bar-wrapper{filter:alpha(opacity=100);opacity:1;transition:none}:host.ng-progress-bar-active .ng-bar{transition:all var(--_ng-progress-speed) var(--_ng-progress-ease)}:host.ng-progress-bar-relative .ng-progress-bar-wrapper{position:relative}:host[direction="ltr+"] .ng-meteor,:host[direction=ltr-] .ng-meteor{rotate:calc(var(--_ng-progress-thickness-add-one) * 1deg)}:host[direction="ltr+"] .ng-bar,:host[direction="rtl+"] .ng-bar{margin-left:-100%}:host[direction="ltr+"] .ng-meteor,:host[direction="rtl+"] .ng-meteor{right:0}:host[direction="ltr+"] .ng-meteor,:host[direction=rtl-] .ng-meteor{top:var(--_ng-progress-meteor-position-px)}:host[direction=ltr-] .ng-meteor,:host[direction="rtl+"] .ng-meteor{bottom:var(--_ng-progress-meteor-position-px)}:host[direction=ltr-] .ng-bar-placeholder,:host[direction="rtl+"] .ng-bar-placeholder{transform:rotate(180deg)}:host[direction=ltr-] .ng-spinner-icon,:host[direction="rtl+"] .ng-spinner-icon{animation-direction:reverse}:host[direction="rtl+"] .ng-meteor,:host[direction=rtl-] .ng-meteor{rotate:calc(var(--_ng-progress-thickness-add-one) * -1deg)}:host .ng-spinner{top:var(--_ng-progress-spinner-spacing-px)}:host[spinnerPosition=left] .ng-spinner{left:var(--_ng-progress-spinner-spacing-px)}:host[spinnerPosition=right] .ng-spinner{right:var(--_ng-progress-spinner-spacing-px)}.ng-progress-bar-wrapper{position:fixed;z-index:999999;top:0;left:0;width:100%;transform:scale(1);filter:alpha(opacity=0);opacity:0;transition:opacity var(--_ng-progress-fade-out-speed) linear}.ng-bar-placeholder{position:absolute;height:var(--_ng-progress-thickness-px);width:100%}.ng-bar{width:100%;height:100%;transform:translate(-100%,0,0);background:var(--_ng-progress-color)}.ng-meteor{display:block;position:absolute;width:100px;height:100%;opacity:1;box-shadow:0 0 10px var(--_ng-progress-color),0 0 5px var(--_ng-progress-color)}.ng-spinner{position:absolute;display:block;z-index:1031;top:10px}.ng-spinner-icon{box-sizing:border-box;animation:spinner-animation var(--_ng-progress-spinner-speed) linear infinite;border-style:solid;border-color:transparent;border-radius:50%;border-top-color:var(--_ng-progress-color);border-left-color:var(--_ng-progress-color);width:var(--_ng-progress-spinner-size-px);height:var(--_ng-progress-spinner-size-px);border-width:var(--_ng-progress-spinner-thickness-px)}@keyframes spinner-animation{0%{transform:rotate(0)}to{transform:rotate(360deg)}}\n']
    }]
  }], null, null);
})();

export {
  NG_PROGRESS_OPTIONS,
  provideNgProgressOptions,
  NgProgressRef,
  NgProgressbar
};
//# sourceMappingURL=chunk-ONPRNNNH.js.map
