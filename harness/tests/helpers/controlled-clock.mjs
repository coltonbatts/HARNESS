// Diagnostic preload: no global OS clock change; each Node test process only.
const NativeDate=Date;
const at=process.env.HARNESS_TEST_NOW;
if(!at||!Number.isFinite(NativeDate.parse(at)))throw Error('HARNESS_TEST_NOW required');
globalThis.Date=class extends NativeDate {
  constructor(...args){super(...(args.length?args:[at]));}
  static now(){return NativeDate.parse(at);}
};
