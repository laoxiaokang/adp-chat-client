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
      if (action) {
        const { widgetId, widgetRunId } = resolveWidgetIds(widgetEl);
        onWidgetAction?.(action as WidgetActionPayload);

        const syntheticEvent = new CustomEvent('widget-event', {
          detail: { action },
          bubbles: true,
          composed: true,
        });
        onWidgetEvent?.(syntheticEvent, widgetRunId, widgetId);
      }
    }) as EventListener);

    container.addEventListener('widget-rendered', ((event: CustomEvent) => {
      const eventTarget = event.target;
      const widgetEl = eventTarget instanceof Element
        ? eventTarget.closest('adp-widget') || eventTarget
        : null;
      if (!widgetEl) {
        return;
      }

      const { success, error } = event.detail || {};
      const { widgetId, widgetRunId } = resolveWidgetIds(widgetEl);
      onWidgetRendered?.({ success, error }, widgetRunId, widgetId);
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
      if (action) {
        const { widgetId, widgetRunId } = resolveWidgetIds(widgetEl);
        const syntheticEvent = new CustomEvent('widget-event', {
          detail: { action },
          bubbles: true,
          composed: true,
        });
        onWidgetEvent?.(syntheticEvent, widgetRunId, widgetId);
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

  async function initWidgets(): Promise<void> {
    const currentVersion = ++initWidgetsVersion;

    if (!containerRef.value) return;

    const widgetWrappers = containerRef.value.querySelectorAll('.adp-widget-wrapper');
    if (widgetWrappers.length === 0) return;

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
      if (currentVersion !== initWidgetsVersion) return;
    }

    if (wasLoaded) {
      try {
        await customElements.whenDefined('adp-widget');
        await new Promise(resolve => setTimeout(resolve, 0));
      } catch {
        // Ignore custom element readiness errors and keep the fallback path below.
      }
      if (currentVersion !== initWidgetsVersion) return;
    }

    if (!containerRef.value) return;
    const currentWrappers = containerRef.value.querySelectorAll('.adp-widget-wrapper');
    const isDisabled = disable();

    currentWrappers.forEach((wrapper) => {
      const widgetEl = wrapper.querySelector('adp-widget');
      if (!widgetEl) return;

      if (widgetEl.hasAttribute('data-upgraded')) {
        updateWidgetDisable(widgetEl, isDisabled);
        return;
      }

      const parent = widgetEl.parentNode;
      if (parent) {
        const newWidget = document.createElement('adp-widget');
        Array.from(widgetEl.attributes).forEach((attr) => {
          if (attr.name === 'data-upgraded') return;
          newWidget.setAttribute(attr.name, attr.value);
        });

        updateWidgetDisable(newWidget, isDisabled);
        parent.replaceChild(newWidget, widgetEl);

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
      if (!isMounted.value || !containerRef.value) return;

      const widgets = containerRef.value.querySelectorAll('adp-widget');
      widgets.forEach((widget) => {
        updateWidgetDisable(widget, newDisable);
      });
    },
    { flush: 'post' },
  );

  onMounted(() => {
    isMounted.value = true;
    if (containerRef.value) {
      setupEventDelegation(containerRef.value);
    }
    if (hasWidgetContent(content())) {
      initWidgets();
    }
  });

  onBeforeUnmount(() => {
    if (initWidgetsTimer) {
      clearTimeout(initWidgetsTimer);
      initWidgetsTimer = null;
    }
    initWidgetsVersion++;
    delegationAttached = false;
  });

  return {
    initWidgets,
    debouncedInitWidgets,
  };
}
