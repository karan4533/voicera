"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomerAccount = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
/**
 * createCustomerAccount
 *
 * Secure callable function to create a new customer tenant account.
 * Requires the caller to be authenticated and have the 'platform_admin' custom claim.
 */
exports.createCustomerAccount = functions.https.onCall(async (data, context) => {
    // 1. Verify Authentication
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    // 2. Verify Authorization (must be a platform admin)
    // Check the custom claim 'role' that we set on admins
    if (context.auth.token.role !== "platform_admin") {
        // If not a custom claim, let's strictly check our fallback email list just in case
        // we are in the demo MVP phase and claims haven't been propagated yet.
        const email = context.auth.token.email || "";
        const adminEmails = [
            "admin@voicera.ai",
            "admin@vocera.ai",
            "platform@heuristiclabs.ai",
            "admin@heuristiclabs.ai"
        ];
        if (!adminEmails.includes(email.toLowerCase())) {
            throw new functions.https.HttpsError("permission-denied", "Only Platform Admins can create customer accounts.");
        }
    }
    const { email, password, orgName, contactName, plan, agents } = data;
    // Basic validation
    if (!email || !password || !orgName) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields: email, password, or orgName.");
    }
    try {
        // 3. Create the user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: contactName,
        });
        // 4. Generate an Organization ID
        // E.g. "org-spicegarden" from "Spice Garden"
        const safeOrgName = orgName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const orgId = `org-${safeOrgName}-${Date.now().toString().slice(-4)}`;
        // 5. Set Custom Claims for RBAC
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: "customer_admin",
            orgId: orgId,
        });
        // 6. Save Organization config to Firestore
        // This allows the frontend's AgentContext to query what agents this org has.
        await admin.firestore().collection("organizations").doc(orgId).set({
            orgName: orgName,
            contactName: contactName,
            email: email,
            plan: plan || "Starter",
            status: "active",
            subscribedAgents: agents || [],
            totalCalls: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            ownerUid: userRecord.uid,
        });
        return {
            success: true,
            uid: userRecord.uid,
            orgId: orgId,
            message: `Successfully created ${orgName} with ${agents?.length || 0} agents.`
        };
    }
    catch (error) {
        console.error("Error creating customer account:", error);
        // Use 'aborted' instead of 'internal'. Firebase automatically hides the error message 
        // for 'internal' errors to prevent leaking server details to the client.
        throw new functions.https.HttpsError("aborted", error.message || "An error occurred while creating the account.");
    }
});
//# sourceMappingURL=index.js.map