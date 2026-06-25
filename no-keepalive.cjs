// Workaround for Firebase CLI login failing on Node 22.23.0+ / 24.17.0+
// https://github.com/firebase/firebase-tools/issues/10692
require("http").globalAgent.keepAlive = false;
require("https").globalAgent.keepAlive = false;
