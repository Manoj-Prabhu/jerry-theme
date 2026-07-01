/**
 * ==========================================================
 * Jerry Header
 * Mano Studio
 * ==========================================================
 */

'use strict';

class JerryHeader {
  init() {
    console.log('Jerry Header Loaded');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new JerryHeader().init();
});