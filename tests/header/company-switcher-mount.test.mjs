import test from 'node:test';
import assert from 'node:assert/strict';

import { createCompanySwitcherMount } from '../../blocks/header/companySwitcherMount.js';

function createEvents(initialPayload) {
  const listeners = new Map();
  let payload = initialPayload;

  return {
    lastPayload: () => payload,
    on(eventName, callback, options = {}) {
      listeners.set(eventName, callback);
      if (options.eager && payload !== undefined) callback(payload);
      return {
        off() {
          listeners.delete(eventName);
        },
      };
    },
    emit(eventName, nextPayload) {
      payload = nextPayload;
      listeners.get(eventName)?.(nextPayload);
    },
  };
}

function createNavTools() {
  const wrappers = [];

  return {
    wrappers,
    addWrapper() {
      const wrapper = {
        remove() {
          const index = wrappers.indexOf(wrapper);
          if (index >= 0) wrappers.splice(index, 1);
        },
      };

      wrappers.push(wrapper);
    },
    querySelector(selector) {
      return selector === '.company-switcher-wrapper' ? wrappers[0] || null : null;
    },
    querySelectorAll(selector) {
      return selector === '.company-switcher-wrapper' ? [...wrappers] : [];
    },
  };
}

function createController({
  companiesEnabled = true,
  cookieAuthenticated = false,
  initialAuthPayload,
} = {}) {
  const events = createEvents(initialAuthPayload);
  const navTools = createNavTools();
  let renderCount = 0;

  const controller = createCompanySwitcherMount({
    navTools,
    events,
    getCompaniesEnabled: () => companiesEnabled,
    isAuthenticated: () => cookieAuthenticated,
    renderCompanySwitcher: async () => {
      renderCount += 1;
      navTools.addWrapper();
    },
  });

  return {
    controller,
    events,
    navTools,
    get renderCount() {
      return renderCount;
    },
  };
}

test('mounts when the auth cookie is present on page load and companies are enabled', async () => {
  const harness = createController({ cookieAuthenticated: true });

  await harness.controller.start();

  assert.equal(harness.renderCount, 1);
  assert.equal(harness.navTools.wrappers.length, 1);
});

test('mounts when authentication arrives after the header is decorated', async () => {
  const harness = createController();

  await harness.controller.start();
  assert.equal(harness.renderCount, 0);

  harness.events.emit('authenticated', true);
  await harness.controller.mountIfEligible(true);

  assert.equal(harness.renderCount, 1);
  assert.equal(harness.navTools.wrappers.length, 1);
});

test('does not mount duplicate switchers for repeated auth events', async () => {
  const harness = createController();

  await harness.controller.start();
  harness.events.emit('authenticated', true);
  await harness.controller.mountIfEligible(true);
  harness.events.emit('authenticated', true);
  await harness.controller.mountIfEligible(true);

  assert.equal(harness.renderCount, 1);
  assert.equal(harness.navTools.wrappers.length, 1);
});

test('removes the switcher when the user logs out', async () => {
  const harness = createController({ cookieAuthenticated: true });

  await harness.controller.start();
  assert.equal(harness.navTools.wrappers.length, 1);

  harness.events.emit('authenticated', false);

  assert.equal(harness.navTools.wrappers.length, 0);
  assert.equal(harness.controller.isMounted(), false);
});

test('does not mount when company switching is disabled', async () => {
  const harness = createController({
    companiesEnabled: false,
    cookieAuthenticated: true,
  });

  await harness.controller.start();
  harness.events.emit('authenticated', true);
  await harness.controller.mountIfEligible(true);

  assert.equal(harness.renderCount, 0);
  assert.equal(harness.navTools.wrappers.length, 0);
});
