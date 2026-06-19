/**
 * Coordinates the header company switcher with auth state. The switcher drop-in
 * renders nothing for single-company users, so this controller only guarantees
 * that the drop-in is mounted when a B2B session can use it.
 *
 * @param {object} options
 * @param {Element} options.navTools
 * @param {{on?: Function, lastPayload?: Function}} options.events
 * @param {Function} options.getCompaniesEnabled
 * @param {Function} options.isAuthenticated
 * @param {Function} options.renderCompanySwitcher
 * @returns {{
 *  start: Function,
 *  stop: Function,
 *  mountIfEligible: Function,
 *  remove: Function,
 *  isMounted: Function
 * }}
 */
export function createCompanySwitcherMount({
  navTools,
  events,
  getCompaniesEnabled,
  isAuthenticated,
  renderCompanySwitcher,
}) {
  const selector = '.company-switcher-wrapper';
  let authSubscription;
  let mounted = false;
  let mounting = null;
  let lastAuthEvent = events?.lastPayload?.('authenticated');

  const isCompaniesEnabled = () => getCompaniesEnabled?.() === true;
  const hasAuthenticatedSession = (authState = lastAuthEvent) => (
    authState === true || (authState !== false && Boolean(isAuthenticated?.()))
  );
  const shouldMount = (authState = lastAuthEvent) => (
    isCompaniesEnabled() && hasAuthenticatedSession(authState)
  );

  const remove = () => {
    navTools.querySelectorAll(selector).forEach((element) => element.remove());
    mounted = false;
  };

  const mountIfEligible = async (authState = lastAuthEvent) => {
    lastAuthEvent = authState;

    if (!shouldMount(authState)) {
      remove();
      return null;
    }

    if (mounted) return null;
    if (mounting) return mounting;

    mounting = Promise.resolve()
      .then(() => renderCompanySwitcher(navTools))
      .then((result) => {
        if (!shouldMount(lastAuthEvent)) {
          remove();
          return result;
        }

        mounted = Boolean(navTools.querySelector(selector));
        return result;
      })
      .finally(() => {
        mounting = null;
      });

    return mounting;
  };

  const onAuthenticated = (isAuthenticatedEvent) => {
    lastAuthEvent = isAuthenticatedEvent;

    if (isAuthenticatedEvent === false) {
      remove();
      return;
    }

    mountIfEligible(isAuthenticatedEvent);
  };

  const start = () => {
    authSubscription = events?.on?.('authenticated', onAuthenticated, { eager: true });
    return mountIfEligible(lastAuthEvent);
  };

  const stop = () => {
    authSubscription?.off?.();
    remove();
  };

  return {
    start,
    stop,
    mountIfEligible,
    remove,
    isMounted: () => mounted || Boolean(navTools.querySelector(selector)),
  };
}

export default createCompanySwitcherMount;
