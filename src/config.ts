// array of basic auths in format encodeURIComponent("url"):login:password, use comma as separator
process.env.BASIC_AUTHS ||= void 0;
process.env.BOTVIEW_BASIC_AUTHS ||= process.env.BASIC_AUTHS; // BASIC_AUTHS - legacy env
process.env.BOTVIEW_NAV_TIMEOUT ||= "30000"; // ms
process.env.BOTVIEW_DEFAULT_TIMEOUT ||= "15000"; // ms
process.env.BOTVIEW_WAIT_UNTIL ||= "networkidle"; // load | domcontentloaded | networkidle | commit

export const config = {
    basicAuth: process.env.BOTVIEW_BASIC_AUTHS,
    navTimeout: Number(process.env.BOTVIEW_NAV_TIMEOUT),
    defaultTimeout: Number(process.env.BOTVIEW_DEFAULT_TIMEOUT),
    waitUntil: process.env.BOTVIEW_WAIT_UNTIL,
};
