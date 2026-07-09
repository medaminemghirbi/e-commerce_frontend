import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router
} from "./chunk-FMA463SQ.js";
import {
  NgProgressRef
} from "./chunk-ONPRNNNH.js";
import {
  takeUntilDestroyed
} from "./chunk-KPUJH3UM.js";
import "./chunk-IJCCASDV.js";
import "./chunk-5C4RM6YP.js";
import "./chunk-4CCJQSDQ.js";
import "./chunk-BGDQGI3U.js";
import "./chunk-QIZTLKUD.js";
import {
  Directive,
  setClassMetadata,
  ɵɵHostDirectivesFeature,
  ɵɵInheritDefinitionFeature,
  ɵɵdefineDirective,
  ɵɵgetInheritedFactory
} from "./chunk-P3OHJKS6.js";
import {
  InjectionToken,
  inject
} from "./chunk-RBEGZ7DM.js";
import "./chunk-HWYXSU2G.js";
import "./chunk-JRFR6BLO.js";
import {
  filter,
  map,
  tap
} from "./chunk-MARUHEWW.js";
import {
  __spreadValues
} from "./chunk-HFBNPKKE.js";

// node_modules/ngx-progressbar/fesm2022/ngx-progressbar-router.mjs
var defaultRouterOptions = {
  minDuration: 0,
  startEvents: [NavigationStart],
  completeEvents: [NavigationEnd, NavigationCancel, NavigationError]
};
var NG_PROGRESS_ROUTER_OPTIONS = new InjectionToken("NG_PROGRESS_ROUTER_OPTIONS", {
  providedIn: "root",
  factory: () => defaultRouterOptions
});
function provideNgProgressRouter(options) {
  return {
    provide: NG_PROGRESS_ROUTER_OPTIONS,
    useValue: __spreadValues(__spreadValues({}, defaultRouterOptions), options)
  };
}
function eventExists(routerEvent, events) {
  return events.some((e) => routerEvent instanceof e);
}
var NgProgressRouterBase = class _NgProgressRouterBase {
  constructor() {
    this.router = inject(Router);
    this.config = inject(NG_PROGRESS_ROUTER_OPTIONS);
    this.progressRef = inject(NgProgressRef, {
      host: true,
      self: true
    });
    let completeTimeout;
    this.router.events.pipe(filter((event) => eventExists(event, [...this.config.startEvents, ...this.config.completeEvents])), map((event) => eventExists(event, this.config.startEvents)), tap((toggle) => {
      clearTimeout(completeTimeout);
      if (toggle) {
        this.progressRef.start();
      } else {
        completeTimeout = setTimeout(() => {
          this.progressRef.complete();
        }, this.config.minDuration);
      }
    }), takeUntilDestroyed()).subscribe();
  }
  static {
    this.ɵfac = function NgProgressRouterBase_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _NgProgressRouterBase)();
    };
  }
  static {
    this.ɵdir = ɵɵdefineDirective({
      type: _NgProgressRouterBase
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgProgressRouterBase, [{
    type: Directive
  }], () => [], null);
})();
var NgProgressRouter = class _NgProgressRouter extends NgProgressRouterBase {
  static {
    this.ɵfac = /* @__PURE__ */ (() => {
      let ɵNgProgressRouter_BaseFactory;
      return function NgProgressRouter_Factory(__ngFactoryType__) {
        return (ɵNgProgressRouter_BaseFactory || (ɵNgProgressRouter_BaseFactory = ɵɵgetInheritedFactory(_NgProgressRouter)))(__ngFactoryType__ || _NgProgressRouter);
      };
    })();
  }
  static {
    this.ɵdir = ɵɵdefineDirective({
      type: _NgProgressRouter,
      selectors: [["ng-progress", "ngProgressRouter", ""]],
      features: [ɵɵInheritDefinitionFeature]
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgProgressRouter, [{
    type: Directive,
    args: [{
      standalone: true,
      selector: "ng-progress[ngProgressRouter]"
    }]
  }], null, null);
})();
var NgProgressRouterRef = class _NgProgressRouterRef extends NgProgressRouterBase {
  static {
    this.ɵfac = /* @__PURE__ */ (() => {
      let ɵNgProgressRouterRef_BaseFactory;
      return function NgProgressRouterRef_Factory(__ngFactoryType__) {
        return (ɵNgProgressRouterRef_BaseFactory || (ɵNgProgressRouterRef_BaseFactory = ɵɵgetInheritedFactory(_NgProgressRouterRef)))(__ngFactoryType__ || _NgProgressRouterRef);
      };
    })();
  }
  static {
    this.ɵdir = ɵɵdefineDirective({
      type: _NgProgressRouterRef,
      selectors: [["", "ngProgressRouter", "", 5, "ng-progress"]],
      features: [ɵɵHostDirectivesFeature([NgProgressRef]), ɵɵInheritDefinitionFeature]
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgProgressRouterRef, [{
    type: Directive,
    args: [{
      standalone: true,
      selector: "[ngProgressRouter]:not(ng-progress)",
      hostDirectives: [NgProgressRef]
    }]
  }], null, null);
})();
export {
  NG_PROGRESS_ROUTER_OPTIONS,
  NgProgressRouter,
  NgProgressRouterRef,
  provideNgProgressRouter
};
//# sourceMappingURL=ngx-progressbar_router.js.map
