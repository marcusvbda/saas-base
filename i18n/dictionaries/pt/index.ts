import common from './common';
import signIn from './signIn';
import register from './register';
import forgotPassword from './forgotPassword';
import updatePassword from './updatePassword';
import dashboard from './dashboard';
import settings from './settings';
import accountSettings from './accountSettings';
import credentialSettings from './credentialSettings';
import generalSettings from './generalSettings';
import planSettings from './planSettings';
import billingSettings from './billingSettings';
import navigation from './navigation';
import socialLogin from './socialLogin';
import languageSelector from './languageSelector';

export default {
	...common,
	...signIn,
	...register,
	...forgotPassword,
	...updatePassword,
	...dashboard,
	...settings,
	...accountSettings,
	...credentialSettings,
	...generalSettings,
	...planSettings,
	...billingSettings,
	...navigation,
	...socialLogin,
	...languageSelector,
} as const;
