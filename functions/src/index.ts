import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * createCustomerAccount
 *
 * Secure callable function to create a new customer tenant account.
 * Requires the caller to be authenticated and have the 'platform_admin' custom claim.
 */
export const createCustomerAccount = functions.https.onCall(async (data, context) => {
  // 1. Verify Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
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
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only Platform Admins can create customer accounts."
      );
    }
  }

  const { email, password, orgName, contactName, plan, agents } = data;

  // Basic validation
  if (!email || !password || !orgName) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: email, password, or orgName."
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const agentList: string[] = agents || [];

  try {
    // 3. Create or look up the user in Firebase Auth
    let userRecord: admin.auth.UserRecord;
    let existingUser = false;

    try {
      userRecord = await admin.auth().getUserByEmail(normalizedEmail);
      existingUser = true;
      await admin.auth().updateUser(userRecord.uid, {
        password,
        displayName: contactName,
      });
    } catch (authErr: any) {
      if (authErr.code !== "auth/user-not-found") throw authErr;
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

    // One org per Auth user — never key by email domain (collides across tenants).
    const orgId = !byEmail.empty ? byEmail.docs[0].id : `org-${userRecord.uid}`;
    const orgFields = {
      orgName,
      contactName,
      email: normalizedEmail,
      plan: plan || "Starter",
      status: "active",
      ownerUid: userRecord.uid,
      subscribedAgents: agentList,
    };

    if (!byEmail.empty) {
      await orgCollection.doc(orgId).update(orgFields);
    } else {
      await orgCollection.doc(orgId).set({
        ...orgFields,
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
        ? `Updated ${orgName} — assigned ${agentList.length} agent(s).`
        : `Successfully created ${orgName} with ${agentList.length} agent(s).`,
    };
  } catch (error: any) {
    console.error("Error creating customer account:", error);
    // Use 'aborted' instead of 'internal'. Firebase automatically hides the error message 
    // for 'internal' errors to prevent leaking server details to the client.
    throw new functions.https.HttpsError(
      "aborted",
      error.message || "An error occurred while creating the account."
    );
  }
});
