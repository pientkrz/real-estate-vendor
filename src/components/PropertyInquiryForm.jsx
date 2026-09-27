import React, { useRef, useState } from 'react';
import PhoneInput from './PhoneInput';
import { isValidPhoneNumber } from '../utils/phoneValidation';

const PropertyInquiryForm = ({ propertyId, propertyTitle, propertyUrl }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
        accepted: false,
    });
    const [phoneError, setPhoneError] = useState('');
    const [status, setStatus] = useState('idle'); // idle | submitting | success | error
    const [statusMessage, setStatusMessage] = useState('');
    const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(false);
    const [consentError, setConsentError] = useState(false);
    const [consentAttempt, setConsentAttempt] = useState(0);
    const consentRef = useRef(null);
    const consentContainerRef = useRef(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const validatePhone = () => {
        const valid = isValidPhoneNumber(formData.phone);
        setPhoneError(valid ? '' : 'Podaj poprawny numer telefonu.');
        return valid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.accepted) {
            showConsentError();
            return;
        }
        if (!validatePhone()) return;

        setStatus('submitting');
        try {
            const traceparent = window.__globalSHomeCreateChildTraceparent?.();
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(traceparent ? { traceparent } : {}) },
                body: JSON.stringify({
                    ...formData,
                    source: 'property-inquiry',
                    propertyId,
                    propertyTitle,
                    propertyUrl,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Nie udało się wysłać wiadomości.');
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setStatusMessage(err.message);
        }
    };

    const showConsentError = () => {
        setConsentError(true);
        setConsentAttempt((attempt) => attempt + 1);
        consentRef.current?.focus({ preventScroll: true });
        consentContainerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    };

    const handleConsentChange = (e) => {
        handleChange(e);
        if (e.target.checked) setConsentError(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <input
                type="text"
                name="website"
                value={formData.website || ''}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] w-px h-px overflow-hidden"
            />

            <div>
                <input
                    type="text"
                    name="name"
                    placeholder="Imię i nazwisko"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-surface border-b border-outline/20 px-3 py-3 focus:outline-none focus:border-primary transition-colors font-body text-sm"
                />
            </div>
            <div>
                <input
                    type="email"
                    name="email"
                    placeholder="Adres e-mail"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-surface border-b border-outline/20 px-3 py-3 focus:outline-none focus:border-primary transition-colors font-body text-sm"
                />
            </div>

            <PhoneInput
                value={formData.phone}
                onChange={handleChange}
                onBlur={validatePhone}
                error={phoneError}
                label="Numer telefonu"
            />

            <div>
                <textarea
                    name="message"
                    placeholder="Treść wiadomości"
                    rows="4"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className="block w-full bg-surface border-b border-outline/20 px-3 py-3 focus:outline-none focus:border-primary transition-colors font-body text-sm resize-none"
                ></textarea>
            </div>

            <div ref={consentContainerRef} className="space-y-2 scroll-mt-24">
              <div className="flex items-start gap-3">
                <label htmlFor="property-inquiry-accepted" className="relative flex items-start cursor-pointer">
                    <input
                        type="checkbox"
                        name="accepted"
                        id="property-inquiry-accepted"
                        checked={formData.accepted}
                        onChange={handleConsentChange}
                        ref={consentRef}
                        aria-invalid={consentError}
                        aria-describedby={consentError ? 'property-consent-error' : undefined}
                        className="peer sr-only"
                    />
                    <div
                        key={consentAttempt}
                        className={`w-4 h-4 min-w-[16px] border rounded-sm bg-surface transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 flex items-center justify-center ${consentError ? 'border-error text-error peer-focus-visible:ring-error' : 'border-outline/50 peer-focus-visible:ring-primary'} peer-checked:bg-primary peer-checked:border-primary ${consentError ? 'consent-shake' : ''}`}
                    >
                        <svg className="w-3 h-3 text-on-primary opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </label>
                <div className="min-w-0 flex-1 text-[9px] leading-relaxed text-outline">
                  <div id="property-privacy-details" className="inline">
                    <label htmlFor="property-inquiry-accepted" className="cursor-pointer">
                      {isPrivacyExpanded
                        ? 'Akceptuję. Dane osobowe ulegające przetwarzaniu: imię i nazwisko, adres e-mail, numer telefonu. Administratorem danych osobowych jest firma Smart Trade Sp. z o.o. Dane osobowe będą przetwarzane w celu odpowiedzi na zapytanie skierowane przy użyciu formularza kontaktowego oraz prowadzenie ewentualnego dalszego kontaktu na Pani/Pana życzenie.'
                        : 'Akceptuję. Dane osobowe ulegające przetwarzaniu: imię i nazwisko ...'}
                    </label>
                    {isPrivacyExpanded && (
                      <a href={`${import.meta.env.BASE_URL}privacy-policy`} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-70 transition-opacity">Polityka Prywatności</a>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-expanded={isPrivacyExpanded}
                    aria-controls="property-privacy-details"
                    onClick={() => setIsPrivacyExpanded((expanded) => !expanded)}
                    className="inline rounded-sm px-0.5 font-label text-primary underline underline-offset-2 hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {isPrivacyExpanded ? 'Zwiń' : 'Czytaj więcej'}
                  </button>
                  {!isPrivacyExpanded && <span aria-hidden="true">...</span>}
                </div>
              </div>
              <div className="min-h-4 pl-7">
                {consentError && <p id="property-consent-error" role="alert" className="text-xs text-error">Zaznacz zgodę, aby wysłać zapytanie.</p>}
              </div>
            </div>

            <button
                type="submit"
                onClick={(e) => {
                    if (!formData.accepted) {
                        e.preventDefault();
                        showConsentError();
                    }
                }}
                disabled={status === 'submitting'}
                className="w-full editorial-gradient text-on-primary font-label uppercase tracking-[0.2em] py-4 text-sm hover:opacity-90 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === 'submitting' ? 'Wysyłanie...' : 'Wyślij zapytanie'}
            </button>
            {status === 'success' && (
                <p className="text-center text-sm text-primary font-body">
                    Dziękujemy za kontakt. Przedstawiciel Global S Home skontaktuje się z Tobą wkrótce.
                </p>
            )}
            {status === 'error' && (
                <p className="text-center text-sm text-red-600 font-body">
                    {statusMessage}
                </p>
            )}
        </form>
    );
};

export default PropertyInquiryForm;
