export class IcalExpander {
    constructor(opts: any);
    maxIterations: any;
    skipInvalidDates: any;
    jCalData: any;
    component: any;
    events: any;
    between(after: any, before: any): {
        events: any[];
        occurrences: any[];
    };
    before(before: any): {
        events: any[];
        occurrences: any[];
    };
    after(after: any): {
        events: any[];
        occurrences: any[];
    };
    all(): {
        events: any[];
        occurrences: any[];
    };
}
//# sourceMappingURL=IcalExpander.d.ts.map