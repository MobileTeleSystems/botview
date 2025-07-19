// array of basic auths in format encodeURIComponent("url"):login:password, use comma or space as separator
process.env.BASIC_AUTHS ||= void 0;
process.env.BOTVIEW_BASIC_AUTHS ||= process.env.BASIC_AUTHS; // BASIC_AUTHS - legacy env
process.env.BOTVIEW_NAV_TIMEOUT ||= "3000000"; // ms
process.env.BOTVIEW_DEFAULT_TIMEOUT ||= "15000"; // ms
process.env.BOTVIEW_WAIT_UNTIL ||= "networkidle"; // load | domcontentloaded | networkidle | commit
process.env.BOTVIEW_BLOCK_IMAGES ||= "true"; // true to block images
process.env.BOTVIEW_BLOCK_STYLESHEETS ||= "true"; // true to block stylesheets
process.env.BOTVIEW_BLOCK_FONTS ||= "true"; // true to block fonts
process.env.BOTVIEW_BLOCK_MEDIA ||= "true"; // true to block media
process.env.BOTVIEW_BLOCK_URLS ||= ""; // comma or space separated list of URL-encoded urls to block
process.env.BOTVIEW_BLOCK_URLS_REGEX ||= ""; // comma or space separated list of URL-encoded regexes to block

export const config = {
    basicAuth: process.env.BOTVIEW_BASIC_AUTHS,
    basicAuthParsed: process.env.BOTVIEW_BASIC_AUTHS
        ? process.env.BOTVIEW_BASIC_AUTHS.split(/[,\s]+/).map((auth) => {
              const parts = decodeURIComponent(auth.trim()).split(":");
              return [parts[0], parts[1], parts[2]] as [string, string, string];
          })
        : [],
    navTimeout: Number(process.env.BOTVIEW_NAV_TIMEOUT),
    defaultTimeout: Number(process.env.BOTVIEW_DEFAULT_TIMEOUT),
    waitUntil: process.env.BOTVIEW_WAIT_UNTIL,
    blockImages: process.env.BOTVIEW_BLOCK_IMAGES === "true",
    blockStylesheets: process.env.BOTVIEW_BLOCK_STYLESHEETS === "true",
    blockFonts: process.env.BOTVIEW_BLOCK_FONTS === "true",
    blockMedia: process.env.BOTVIEW_BLOCK_MEDIA === "true",
    blockUrls: process.env.BOTVIEW_BLOCK_URLS
        ? process.env.BOTVIEW_BLOCK_URLS.split(/[,\s]+/)
              .map((url) => decodeURIComponent(url.trim()))
              .filter(Boolean)
        : [],
    blockUrlsRegex: process.env.BOTVIEW_BLOCK_URLS_REGEX
        ? process.env.BOTVIEW_BLOCK_URLS_REGEX.split(/[,\s]+/)
              .map((regex) => new RegExp(decodeURIComponent(regex.trim())))
              .filter(Boolean)
        : [],
};
