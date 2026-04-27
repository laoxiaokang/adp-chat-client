import { ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue';
import { isWidgetSdkLoaded, loadWidgetSdk, hasWidgetContent, showFallbackJson } from '../widget';

export interface WidgetActionPayload {
  type: string;
  handler?: string;
  payload?: any;
  snapshot?: string;
  widgetSnapshot?: string;
}

export interface UseWidgetInitOptions {
  containerRef: Ref<HTMLDivElement | null>;
  content: () => string | undefined;
  disable: () => boolean;
  widgetId: () => string;
  widgetRunId: () => string;
  recordId: () => string;
  enableScale?: () => boolean | number;
  onWidgetAction?: (action: WidgetActionPayload) => void;
  onWidgetEvent?: (event: CustomEvent, widgetRunId: string, widgetId: string) => void;
  onWidgetRendered?: (detail: { success: boolean; error?: Error }, widgetRunId: string, widgetId: string) => void;
  onWidgetError?: (error: Error) => void;
}

export function useWidgetInit(options: UseWidgetInitOptions) {
  const {
    containerRef,
    content,
    disable,
    enableScale,
    widgetId: getWidgetId,
    widgetRunId: getWidgetRunId,
    onWidgetAction,
    onWidgetEvent,
    onWidgetRendered,
    onWidgetError,
  } = options;

  const isMounted = ref(false);
  let initWidgetsVersion = 0;
  let initWidgetsTimer: ReturnType<typeof setTimeout> | null = null;
  let resizeHandler: (() => void) | null = null;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  let delegationAttached = false;

  function resolveWidgetIds(widgetEl: Element): { widgetId: string; widgetRunId: string } {
    const wrapper = widgetEl.closest('.adp-widget-wrapper');
    const widgetId = wrapper?.getAttribute('data-widget-id') || getWidgetId() || '';
    const widgetRunId = wrapper?.getAttribute('data-widget-run-id') || getWidgetRunId() || '';
    return { widgetId, widgetRunId };
  }

  function setupEventDelegation(container: HTMLElement): void {
    if (delegationAttached) {
      return;
    }
    delegationAttached = true;

    container.addEventListener('widget-action', ((event: CustomEvent) => {
      const eventTarget = event.target;
      const widgetEl = eventTarget instanceof Element
        ? eventTarget.closest('adp-widget') || eventTarget
        : null;
      if (!widgetEl) {
        return;
      }

      const { action } = event.detail || {};
      if (!action) {
        return;
      }

      const { widgetId, widgetRunId } = resolveWidgetIds(widgetEl);
      onWidgetAction?.(action as WidgetActionPayload);

      const syntheticEvent = new CustomEvent('widget-event', {
        detail: { action },
        bubbles: true,
        composed: true,
      });
      onWidgetEvent?.(syntheticEvent, widgetRunId, widgetId);
    }) as EventListener);

    container.addEventListener('cardsubmit', ((event: CustomEvent) => {
      const eventTarget = event.target;
      const widgetEl = eventTarget instanceof Element
        ? eventTarget.closest('adp-widget') || eventTarget
        : null;
      if (!widgetEl) {
        return;
      }

      const { action } = event.detail || {};
      if (!action) {
        return;
      }

      const { widgetId, widgetRunId } = resolveWidgetIds(widgetEl);
      const syntheticEvent = new CustomEvent('widget-event', {
        detail: { action },
        bubbles: true,
        composed: true,
      });
      onWidgetEvent?.(syntheticEvent, widgetRunId, widgetId);
    }) as EventListener);
  }

  function bindRenderedListener(widgetEl: Element): void {
    if (widgetEl.hasAttribute('data-rendered-bindable')) {
      return;
    }
    widgetEl.setAttribute('data-rendered-bindable', 'true');

    widgetEl.addEventListener('widget-rendered', ((event: CustomEvent) => {
      const { success, error } = event.detail || {};
      const { widgetId, widgetRunId } = resolveWidgetIds(widgetEl);
      onWidgetRendered?.({ success, error }, widgetRunId, widgetId);

      if (enableScale?.()) {
        const wrapper = widgetEl.closest('.adp-widget-wrapper');
        if (wrapper) {
          requestAnimationFrame(() => {
            scaleWidgetIfNeeded(wrapper);
          });
        }
      }
    }) as EventListener);
  }

  function updateWidgetDisable(widgetEl: Element, isDisabled: boolean): void {
    if (isDisabled) {
      widgetEl.setAttribute('disable', 'true');
    } else {
      widgetEl.removeAttribute('disable');
    }
  }

  function resetWidgetScale(wrapperEl: HTMLElement, widgetEl: HTMLElement): void {
    wrapperEl.style.width = '';
    wrapperEl.style.height = '';
    wrapperEl.style.overflow = '';
    widgetEl.style.transform = '';
    widgetEl.style.transformOrigin = '';
  }

  function scaleWidgetIfNeeded(wrapper: Element): void {
    const scaleValue = enableScale?.();
    const widgetEl = wrapper.querySelector('adp-widget') as HTMLElement | null;
    if (!widgetEl) {
      return;
    }

    const wrapperEl = wrapper as HTMLElement;

    if (!scaleValue) {
      resetWidgetScale(wrapperEl, widgetEl);
      return;
    }

    let scale: number | undefined;

    if (typeof scaleValue === 'number') {
      scale = scaleValue;
    } else {
      const parentEl = containerRef.value;
      if (!parentEl) {
        return;
      }

      const containerWidth = parentEl.clientWidth;
      const currentTransform = widgetEl.style.transform;
      widgetEl.style.transform = '';
      const widgetWidth = widgetEl.scrollWidth || widgetEl.offsetWidth;
      widgetEl.style.transform = currentTransform;

      if (containerWidth <= 0 || widgetWidth <= containerWidth) {
        resetWidgetScale(wrapperEl, widgetEl);
        return;
      }

      scale = containerWidth / widgetWidth;
    }

    if (!scale || scale <= 0) {
      resetWidgetScale(wrapperEl, widgetEl);
      return;
    }

    widgetEl.style.transform = '';
    const widgetWidth = widgetEl.scrollWidth || widgetEl.offsetWidth;
    const widgetHeight = widgetEl.scrollHeight || widgetEl.offsetHeight;
    wrapperEl.style.width = `${widgetWidth * scale}px`;
    wrapperEl.style.height = `${widgetHeight * scale}px`;
    wrapperEl.style.overflow = 'visible';
    widgetEl.style.transform = `scale(${scale})`;
    widgetEl.style.transformOrigin = 'top left';
  }

  function scaleAllWidgets(): void {
    if (!containerRef.value) {
      return;
    }
    const wrappers = containerRef.value.querySelectorAll('.adp-widget-wrapper');
    wrappers.forEach((wrapper) => scaleWidgetIfNeeded(wrapper));
  }

  async function initWidgets(): Promise<void> {
    const currentVersion = ++initWidgetsVersion;

    if (!containerRef.value) {
      return;
    }

    const widgetWrappers = containerRef.value.querySelectorAll('.adp-widget-wrapper');
    if (widgetWrappers.length === 0) {
      return;
    }

    setupEventDelegation(containerRef.value);

    const wasLoaded = isWidgetSdkLoaded();
    if (!wasLoaded) {
      try {
        await loadWidgetSdk();
      } catch (error) {
        onWidgetError?.(error instanceof Error ? error : new Error('Failed to load widget SDK'));
        showFallbackJson(widgetWrappers);
        return;
      }
      if (currentVersion !== initWidgetsVersion) {
        return;
      }
    }

    if (wasLoaded) {
      try {
        await customElements.whenDefined('adp-widget');
        await new Promise((resolve) => setTimeout(resolve, 0));
      } catch {
        // Keep the fallback path below.
      }
      if (currentVersion !== initWidgetsVersion) {
        return;
      }
    }

    if (!containerRef.value) {
      return;
    }

    const currentWrappers = containerRef.value.querySelectorAll('.adp-widget-wrapper');
    const isDisabled = disable();

    currentWrappers.forEach((wrapper) => {
      const widgetEl = wrapper.querySelector('adp-widget');
      if (!widgetEl) {
        return;
      }

      if (widgetEl.hasAttribute('data-upgraded')) {
        updateWidgetDisable(widgetEl, isDisabled);
        bindRenderedListener(widgetEl);
        return;
      }

      const parent = widgetEl.parentNode;
      if (parent) {
        const newWidget = document.createElement('adp-widget');
        Array.from(widgetEl.attributes).forEach((attr) => {
          if (attr.name === 'data-upgraded') {
            return;
          }
          newWidget.setAttribute(attr.name, attr.value);
        });

        updateWidgetDisable(newWidget, isDisabled);
        parent.replaceChild(newWidget, widgetEl);
        bindRenderedListener(newWidget);

        const savedVersion = currentVersion;
        customElements.whenDefined('adp-widget').then(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (savedVersion !== initWidgetsVersion || !newWidget.isConnected) {
                return;
              }
              newWidget.setAttribute('data-upgraded', 'true');
            }, 0);
          });
        });
        return;
      }

      updateWidgetDisable(widgetEl, isDisabled);
      bindRenderedListener(widgetEl);
      widgetEl.setAttribute('data-upgraded', 'true');
    });
  }

  function debouncedInitWidgets(): void {
    if (initWidgetsTimer) {
      clearTimeout(initWidgetsTimer);
    }
    initWidgetsTimer = setTimeout(() => {
      initWidgetsTimer = null;
      initWidgets();
    }, 50);
  }

  watch(
    content,
    (newContent) => {
      if (isMounted.value && hasWidgetContent(newContent)) {
        debouncedInitWidgets();
      }
    },
    { flush: 'post' },
  );

  watch(
    disable,
    (newDisable) => {
      if (!isMounted.value || !containerRef.value) {
        return;
      }

      const widgets = containerRef.value.querySelectorAll('adp-widget');
      widgets.forEach((widget) => {
        updateWidgetDisable(widget, newDisable);
      });
    },
    { flush: 'post' },
  );

  if (enableScale) {
    watch(
      enableScale,
      () => {
        if (!isMounted.value) {
          return;
        }
        requestAnimationFrame(() => scaleAllWidgets());
      },
      { flush: 'post' },
    );
  }

  onMounted(() => {
    isMounted.value = true;
    if (containerRef.value) {
      setupEventDelegation(containerRef.value);
    }
    if (hasWidgetContent(content())) {
      initWidgets();
    }

    if (enableScale) {
      resizeHandler = () => {
        if (resizeTimer) {
          clearTimeout(resizeTimer);
        }
        resizeTimer = setTimeout(() => {
          resizeTimer = null;
          if (enableScale() && isMounted.value) {
            scaleAllWidgets();
          }
        }, 200);
      };
      window.addEventListener('resize', resizeHandler);
    }
  });

  onBeforeUnmount(() => {
    if (initWidgetsTimer) {
      clearTimeout(initWidgetsTimer);
      initWidgetsTimer = null;
    }
    if (resizeTimer) {
      clearTimeout(resizeTimer);
      resizeTimer = null;
    }
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
    initWidgetsVersion++;
    delegationAttached = false;
  });

  return {
    initWidgets,
    debouncedInitWidgets,
    scaleAllWidgets,
  };
}
