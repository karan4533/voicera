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
    const normalizedEmail = email.trim().toLowerCase();
    const agentList = agents || [];
    try {
        // 3. Create or look up the user in Firebase Auth
        let userRecord;
        let existingUser = false;
        try {
            userRecord = await admin.auth().getUserByEmail(normalizedEmail);
            existingUser = true;
            await admin.auth().updateUser(userRecord.uid, {
                password,
                displayName: contactName,
            });
        }
        catch (authErr) {
            if (authErr.code !== "auth/user-not-found")
                throw authErr;
            userRecord = await admin.auth().createUser({
                email: normalizedEmail,
                password,
                displayName: contactName,
            });
        }
        // 4. Resolve organisation — prefer existing doc by ownerUid, then email, then domain slug
        const orgCollection = admin.firestore().collection("organizations");
        const byOwner = await orgCollection
            .where("ownerUid", "==", userRecord.uid)
            .limit(1)
            .get();
        const byEmail = byOwner.empty
            ? await orgCollection.where("email", "==", normalizedEmail).limit(1).get()
            : byOwner;
        const domain = normalizedEmail.split("@")[1] ?? "unknown";
        const domainOrgId = `org-${domain.replace(/\./g, "-")}`;
        let orgId;
        const orgFields = {
            orgName,
            contactName,
            email: normalizedEmail,
            plan: plan || "Starter",
            status: "active",
            ownerUid: userRecord.uid,
        };
        if (!byEmail.empty) {
            orgId = byEmail.docs[0].id;
            await orgCollection.doc(orgId).update({
                ...orgFields,
                ...(agentList.length > 0
                    ? { subscribedAgents: admin.firestore.FieldValue.arrayUnion(...agentList) }
                    : {}),
            });
        }
        else {
            orgId = domainOrgId;
            await orgCollection.doc(orgId).set({
                ...orgFields,
                subscribedAgents: agentList,
                totalCalls: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        // 5. Set Custom Claims for RBAC
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: "customer_admin",
            orgId,
        });
        return {
            success: true,
            existingUser,
            uid: userRecord.uid,
            orgId,
            message: existingUser
                ? `Updated ${orgName} — added ${agentList.length} agent(s) to existing account.`
                : `Successfully created ${orgName} with ${agentList.length} agent(s).`,
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