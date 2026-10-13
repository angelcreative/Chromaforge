/** Signed-in account that receives unlimited assistant use. */
export const OWNER_ACCOUNT_EMAIL = 'ajsc50@gmail.com';
/** True only for the Firebase account returned by a verified token lookup. */
export const isOwnerAccount = (account) => {
    const email = account?.email?.trim().toLowerCase();
    return email === OWNER_ACCOUNT_EMAIL;
};
