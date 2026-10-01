(function () {
    const config = window.UNIMATCH_SUPABASE_CONFIG || {};
    const configured = Boolean(config.url && config.anonKey);
    const isHosted = window.location.protocol === 'https:' || window.location.protocol === 'http:';
    const translations = {
        'Не удалось подключиться к Supabase. Проверь URL проекта и публичный ключ.': 'Could not connect to Supabase. Check the project URL and public key.',
        'Заполни корректный email и пароль не короче 8 символов.': 'Enter a valid email and a password with at least 8 characters.',
        'Проверьте почту и введите код подтверждения.': 'Check your email and enter the confirmation code.',
        'Код из письма': 'Email verification code',
        'Введите шестизначный код из письма.': 'Enter the six-digit code from your email.',
        'Введите код из письма для восстановления пароля.': 'Enter the code from your password recovery email.',
        'Подтвердить email': 'Verify email',
        'Проверить код': 'Verify code',
        'Отправить код повторно': 'Resend code',
        'Вернуться ко входу': 'Back to sign in',
        'Код отправлен повторно.': 'A new code has been sent.',
        'Email подтверждён. Теперь можно войти.': 'Email confirmed. You can now sign in.',
        'Не удалось проверить код. Проверь его или запроси новый.': 'Could not verify the code. Check it or request a new one.',
        'Не удалось повторно отправить код. Попробуй ещё раз позже.': 'Could not resend the code. Please try again later.',
        'Не удалось отправить письмо. Проверь email и настройки SMTP в Supabase.': 'Could not send the email. Check the address and Supabase SMTP settings.',
        'Регистрация завершена. Вы вошли в аккаунт.': 'Sign-up complete. You are now signed in.',
        'Вы вошли в аккаунт.': 'You are signed in.',
        'Пароль обновлён.': 'Your password has been updated.',
        'Пароли не совпадают.': 'Passwords do not match.',
        'Не используй пароль от важных аккаунтов (почты, банка и других сервисов). Придумай уникальный пароль для UniverSeeker.': 'Do not reuse a password from important accounts (email, banking, or other services). Create a unique password for UniverSeeker.',
        'Введите новый пароль не короче 8 символов.': 'Enter a new password with at least 8 characters.',
        'Регистрация': 'Create account',
        'Вход': 'Sign in',
        'Сброс пароля': 'Reset password',
        'Новый пароль': 'New password',
        'Выйти': 'Sign out',
        'Мой кабинет': 'My dashboard',
        'Чтобы включить регистрацию и вход, укажи URL Supabase и публичный ключ в файле supabase-config.js. Секретные ключи сюда добавлять нельзя.': 'To enable sign-up and sign-in, add your Supabase URL and public key to supabase-config.js. Do not put secret keys here.',
        'Сначала опубликуй сайт на HTTPS, затем добавь его адрес в разрешённые URL в настройках Supabase Auth.': 'Deploy the site over HTTPS first, then add its address to the allowed URLs in Supabase Auth settings.',
        'Проверь email и пароль. Если аккаунт новый, сначала зарегистрируйся.': 'Check your email and password. If this is a new account, sign up first.',
        'Не удалось зарегистрироваться. Проверь email и попробуй ещё раз.': 'Could not create the account. Check the email address and try again.',
        'Не удалось обновить пароль. Запроси новый код восстановления.': 'Could not update the password. Request a new recovery code.',
        'Произошла ошибка. Попробуй ещё раз.': 'Something went wrong. Please try again.'
    };

    function text(value) {
        return window.UniMatchI18n ? window.UniMatchI18n.t(value) : value;
    }

    function authText(value) {
        if (window.UniMatchI18n?.language !== 'en') return value;
        return translations[value] || text(value);
    }

    function setMessage(element, message, isError = false, details = '') {
        if (!element) return;
        element.dataset.messageKey = message || '';
        element.dataset.messageError = String(isError);
        element.textContent = `${authText(message)}${details ? ` (${details})` : ''}`;
        element.classList.toggle('hidden', !message);
        element.classList.toggle('border-rose-200', isError);
        element.classList.toggle('bg-rose-50', isError);
        element.classList.toggle('text-rose-800', isError);
        element.classList.toggle('border-emerald-200', !isError);
        element.classList.toggle('bg-emerald-50', !isError);
        element.classList.toggle('text-emerald-800', !isError);
    }

    function errorDetails(error) {
        return typeof error?.message === 'string' ? error.message.trim() : '';
    }

    function getSafeNextPath() {
        const next = new URLSearchParams(window.location.search).get('next');
        return next && /^(account|hou)\.html$/.test(next) ? next : 'account.html';
    }

    function updateAuthNavigation(user) {
        document.querySelectorAll('[data-auth-guest]').forEach(element => element.classList.toggle('hidden', Boolean(user)));
        document.querySelectorAll('[data-auth-user]').forEach(element => element.classList.toggle('hidden', !user));
        document.querySelectorAll('[data-auth-email]').forEach(element => {
            element.textContent = user?.email || '';
        });
    }

    async function initialize() {
        const notice = document.getElementById('auth-setup-notice');
        const form = document.getElementById('auth-form');
        const formMessage = document.getElementById('auth-message');
        const modeTabs = document.querySelectorAll('[data-auth-mode]');
        const passwordConfirmation = document.getElementById('password-confirmation-field');
        const passwordLabel = document.getElementById('password-label');
        const passwordReuseWarning = document.getElementById('password-reuse-warning');
        const submitButton = document.getElementById('auth-submit');
        const forgotButton = document.getElementById('forgot-password');
        const resendButton = document.getElementById('resend-code');
        const backButton = document.getElementById('back-to-login');
        const tabsContainer = document.getElementById('auth-mode-tabs');
        const nameField = document.getElementById('display-name-field');
        const passwordContainer = document.getElementById('password-field');
        const passwordField = document.getElementById('password');
        const otpContainer = document.getElementById('otp-field');
        const otpInput = document.getElementById('email-code');
        const otpLabel = document.getElementById('otp-label');
        const otpHelp = document.getElementById('otp-help');
        const nameInput = document.getElementById('display-name');
        const emailInput = document.getElementById('email');
        const confirmationInput = document.getElementById('password-confirmation');

        let mode = new URLSearchParams(window.location.search).get('mode') === 'reset' ? 'new-password' : 'login';
        let supabaseClient = null;

        if (!configured) {
            setMessage(notice, 'Чтобы включить регистрацию и вход, укажи URL Supabase и публичный ключ в файле supabase-config.js. Секретные ключи сюда добавлять нельзя.', true);
        } else if (!isHosted) {
            setMessage(notice, 'Сначала опубликуй сайт на HTTPS, затем добавь его адрес в разрешённые URL в настройках Supabase Auth.', true);
        } else if (!window.supabase?.createClient) {
            setMessage(notice, 'Не удалось подключиться к Supabase. Проверь URL проекта и публичный ключ.', true);
        } else {
            supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
            });
        }

        const authControls = [...modeTabs, submitButton, forgotButton, resendButton, backButton, emailInput, passwordField, confirmationInput, nameInput, otpInput]
            .filter(Boolean);
        authControls.forEach(control => { control.disabled = !supabaseClient; });

        function renderMode() {
            const creatingAccount = mode === 'signup';
            const resetting = mode === 'reset';
            const settingNewPassword = mode === 'new-password';
            const verifyingSignup = mode === 'verify-signup';
            const verifyingReset = mode === 'verify-reset';
            const verifyingCode = verifyingSignup || verifyingReset;
            const normalMode = mode === 'login' || creatingAccount;
            if (passwordConfirmation) passwordConfirmation.classList.toggle('hidden', !creatingAccount);
            if (nameField) nameField.classList.toggle('hidden', !creatingAccount);
            if (passwordReuseWarning) passwordReuseWarning.classList.toggle('hidden', !creatingAccount);
            if (passwordContainer) passwordContainer.classList.toggle('hidden', resetting || verifyingCode);
            if (passwordField) passwordField.required = !resetting && !verifyingCode;
            if (confirmationInput) confirmationInput.required = creatingAccount;
            if (otpContainer) otpContainer.classList.toggle('hidden', !verifyingCode);
            if (otpInput) otpInput.required = verifyingCode;
            if (otpLabel) otpLabel.textContent = authText('Код из письма');
            if (otpHelp) otpHelp.textContent = verifyingReset
                ? authText('Введите код из письма для восстановления пароля.')
                : authText('Введите шестизначный код из письма.');
            if (emailInput) emailInput.readOnly = verifyingCode;
            if (passwordField) passwordField.autocomplete = creatingAccount || settingNewPassword
                ? 'new-password'
                : 'current-password';
            if (passwordLabel) passwordLabel.textContent = authText(settingNewPassword ? 'Новый пароль' : 'Пароль');
            if (passwordField) passwordField.placeholder = authText(settingNewPassword ? 'Новый пароль' : 'Пароль');
            const emailField = document.getElementById('email');
            if (emailField) emailField.required = !settingNewPassword;
            if (tabsContainer) tabsContainer.classList.toggle('hidden', !normalMode);
            if (submitButton) {
                submitButton.textContent = authText(
                    creatingAccount ? 'Регистрация'
                        : resetting ? 'Сброс пароля'
                            : verifyingSignup ? 'Подтвердить email'
                                : verifyingReset ? 'Проверить код'
                                    : settingNewPassword ? 'Новый пароль'
                                        : 'Вход'
                );
            }
            if (forgotButton) forgotButton.classList.toggle('hidden', mode !== 'login');
            if (resendButton) resendButton.classList.toggle('hidden', !verifyingCode);
            if (backButton) backButton.classList.toggle('hidden', normalMode);
            modeTabs.forEach(tab => {
                const active = tab.dataset.authMode === mode;
                tab.classList.toggle('bg-white', active);
                tab.classList.toggle('text-brand-700', active);
                tab.classList.toggle('shadow-sm', active);
                tab.classList.toggle('text-slate-500', !active);
            });
        }

        function displayUser(user) {
            updateAuthNavigation(user);
            if (!form || !user) return;
            setMessage(formMessage, 'Вы вошли в аккаунт.');
            form.classList.add('hidden');
            document.getElementById('auth-signed-in')?.classList.remove('hidden');
            const email = document.getElementById('signed-in-email');
            if (email) email.textContent = user.email || '';
        }

        function displaySignedOut() {
            updateAuthNavigation(null);
            form?.classList.remove('hidden');
            document.getElementById('auth-signed-in')?.classList.add('hidden');
        }

        window.addEventListener('unimatch-language-changed', () => {
            renderMode();
            [notice, formMessage].forEach(element => {
                if (element?.dataset.messageKey) {
                    setMessage(element, element.dataset.messageKey, element.dataset.messageError === 'true');
                }
            });
        });

        if (supabaseClient) {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) {
                console.error('UniMatch session read error:', error);
                setMessage(formMessage, 'Не удалось подключиться к Supabase. Проверь URL проекта и публичный ключ.', true, errorDetails(error));
            }
            if (session?.user && mode !== 'new-password') displayUser(session.user);
            else displaySignedOut();

            supabaseClient.auth.onAuthStateChange((event, sessionUpdate) => {
                if (event === 'PASSWORD_RECOVERY') {
                    mode = 'new-password';
                    displaySignedOut();
                    renderMode();
                } else if (sessionUpdate?.user && mode !== 'new-password') {
                    displayUser(sessionUpdate.user);
                } else {
                    displaySignedOut();
                }
            });
        }

        document.querySelectorAll('[data-auth-mode]').forEach(tab => {
            tab.addEventListener('click', () => {
                mode = tab.dataset.authMode;
                emailInput.readOnly = false;
                otpInput.value = '';
                setMessage(formMessage, '');
                renderMode();
            });
        });

        forgotButton?.addEventListener('click', () => {
            mode = 'reset';
            emailInput.readOnly = false;
            setMessage(formMessage, '');
            renderMode();
        });

        backButton?.addEventListener('click', () => {
            mode = 'login';
            emailInput.readOnly = false;
            otpInput.value = '';
            passwordField.value = '';
            setMessage(formMessage, '');
            renderMode();
        });

        resendButton?.addEventListener('click', async () => {
            if (!supabaseClient) return;
            resendButton.disabled = true;
            try {
                const email = emailInput.value.trim();
                const result = mode === 'verify-signup'
                    ? await supabaseClient.auth.resend({ type: 'signup', email })
                    : await supabaseClient.auth.resetPasswordForEmail(email);
                if (result.error) throw result.error;
                setMessage(formMessage, 'Код отправлен повторно.');
            } catch (error) {
                console.error('UniMatch email code resend error:', error);
                setMessage(formMessage, 'Не удалось повторно отправить код. Попробуй ещё раз позже.', true, errorDetails(error));
            } finally {
                resendButton.disabled = !supabaseClient;
            }
        });

        form?.addEventListener('submit', async event => {
            event.preventDefault();
            if (!supabaseClient) return;
            setMessage(formMessage, '');

            const email = document.getElementById('email').value.trim();
            const password = passwordField.value;
            const emailCode = otpInput.value.trim();
            const submittedMode = mode;
            const emailRedirectTo = `${window.location.origin}${window.location.pathname}`;
            if (['login', 'signup', 'new-password'].includes(mode) && password.length < 8) {
                setMessage(formMessage, mode === 'new-password'
                    ? 'Введите новый пароль не короче 8 символов.'
                    : 'Заполни корректный email и пароль не короче 8 символов.', true);
                return;
            }

            submitButton.disabled = true;
            try {
                if (mode === 'signup') {
                    if (password !== confirmationInput.value) {
                        setMessage(formMessage, 'Пароли не совпадают.', true);
                        return;
                    }
                    const { data, error } = await supabaseClient.auth.signUp({
                        email,
                        password,
                        options: {
                            emailRedirectTo,
                            data: { display_name: nameInput.value.trim() }
                        }
                    });
                    if (error) throw error;
                    if (data.session) {
                        setMessage(formMessage, 'Регистрация завершена. Вы вошли в аккаунт.');
                        window.location.assign(getSafeNextPath());
                    } else {
                        mode = 'verify-signup';
                        renderMode();
                        setMessage(formMessage, 'Проверьте почту и введите код подтверждения.');
                    }
                } else if (mode === 'login') {
                    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    window.location.assign(getSafeNextPath());
                } else if (mode === 'reset') {
                    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
                    if (error) throw error;
                    mode = 'verify-reset';
                    renderMode();
                    setMessage(formMessage, 'Проверьте почту и введите код подтверждения.');
                } else if (mode === 'verify-signup' || mode === 'verify-reset') {
                    const { data, error } = await supabaseClient.auth.verifyOtp({
                        email,
                        token: emailCode,
                        type: mode === 'verify-signup' ? 'signup' : 'recovery'
                    });
                    if (error) throw error;
                    if (mode === 'verify-signup') {
                        if (data.session) {
                            setMessage(formMessage, 'Регистрация завершена. Вы вошли в аккаунт.');
                            window.location.assign(getSafeNextPath());
                        } else {
                            mode = 'login';
                            emailInput.readOnly = false;
                            renderMode();
                            setMessage(formMessage, 'Email подтверждён. Теперь можно войти.');
                        }
                    } else {
                        mode = 'new-password';
                        otpInput.value = '';
                        displaySignedOut();
                        renderMode();
                        setMessage(formMessage, 'Введите новый пароль не короче 8 символов.');
                    }
                } else {
                    const { error } = await supabaseClient.auth.updateUser({ password });
                    if (error) throw error;
                    mode = 'login';
                    passwordField.value = '';
                    renderMode();
                    setMessage(formMessage, 'Пароль обновлён.');
                }
            } catch (error) {
                console.error('UniMatch authentication error:', error);
                const message = submittedMode === 'signup'
                    ? 'Не удалось зарегистрироваться. Проверь email и попробуй ещё раз.'
                    : submittedMode === 'reset'
                    ? 'Не удалось отправить письмо. Проверь email и настройки SMTP в Supabase.'
                    : submittedMode === 'verify-signup' || submittedMode === 'verify-reset'
                        ? 'Не удалось проверить код. Проверь его или запроси новый.'
                        : submittedMode === 'new-password'
                            ? 'Не удалось обновить пароль. Запроси новый код восстановления.'
                            : 'Проверь email и пароль. Если аккаунт новый, сначала зарегистрируйся.';
                setMessage(formMessage, message, true, errorDetails(error));
            } finally {
                submitButton.disabled = !supabaseClient;
            }
        });

        document.querySelectorAll('[data-auth-signout]').forEach(button => {
            button.addEventListener('click', async () => {
                if (!supabaseClient) return;
                const { error } = await supabaseClient.auth.signOut();
                if (error) {
                    console.error('UniMatch sign-out error:', error);
                    setMessage(formMessage, 'Произошла ошибка. Попробуй ещё раз.', true);
                    return;
                }
                displaySignedOut();
            });
        });

        renderMode();
    }

    window.addEventListener('DOMContentLoaded', () => {
        initialize().catch(error => {
            console.error('UniMatch authentication initialization failed:', error);
            const message = document.getElementById('auth-message');
            setMessage(message, 'Не удалось подключиться к Supabase. Проверь URL проекта и публичный ключ.', true, errorDetails(error));
        });
    });
})();
