// No provider request is allowed until the site and consent integration are ready.
export function eligible(config, consent) {
  return config.enabled === true && config.siteApproved === true && consent === true
    && /^ca-pub-[0-9]{16}$/.test(config.publisherId)
    && /^[0-9]{10}$/.test(config.slotId);
}
const mounted = new WeakSet();
let providerPromise;
function loadProvider(config, doc) {
  if (!providerPromise) providerPromise = new Promise((resolve, reject) => {
    const script = doc.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + config.publisherId;
    const timer = setTimeout(() => reject(new Error('Advertising timed out')), 8000);
    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = () => { clearTimeout(timer); reject(new Error('Advertising unavailable')); };
    doc.head.append(script);
  });
  return providerPromise;
}
// Integrate with a certified CMP before enabling. Missing/unknown consent fails closed.
// Call again after a permitted consent change; repeated calls never request duplicate ads.
export async function mountAd(config, { consent = false, doc = document, win = window } = {}) {
  const slot = doc.querySelector('[data-ad-slot]');
  if (!slot || !eligible(config, consent) || mounted.has(slot)) return false;
  mounted.add(slot);
  try {
    await loadProvider(config, doc);
    if (!slot.isConnected) return false;
    const ad = doc.createElement('ins');
    ad.className = 'adsbygoogle';
    ad.style.display = 'block';
    ad.style.width = '100%';
    ad.style.height = '250px';
    ad.dataset.adClient = config.publisherId;
    ad.dataset.adSlot = config.slotId;
    slot.append(ad);
    slot.hidden = false;
    (win.adsbygoogle = win.adsbygoogle || []).push({});
    // Keep the reserved area stable if no inventory fills; never cover app controls.
    return true;
  } catch (error) {
    slot.hidden = true;
    console.warn('[ads] Slot unavailable; the tool remains usable.', error.message);
    return false;
  }
}
