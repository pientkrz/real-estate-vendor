import React, { useState } from 'react';
import PhoneInput from './PhoneInput';
import { isValidPhoneNumber } from '../utils/phoneValidation';

const PropertyInquiryForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        phoneDialCode: '+48',
        message: '',
        accepted: false,
    });
    const [phoneError, setPhoneError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const validatePhone = () => {
        const valid = isValidPhoneNumber(formData.phone);
        setPhoneError(valid ? '' : 'Podaj poprawny numer telefonu.');
        return valid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validatePhone()) return;
        alert('Dziękujemy za kontakt. Przedstawiciel Global S Home skontaktuje się z Tobą wkrótce.');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <input
                    type="text"
                    name="name"
                    placeholder="Imię i nazwisko"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-surface border-b border-outline/20 py-3 focus:outline-none focus:border-primary transition-colors font-body text-sm"
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
                    className="w-full bg-surface border-b border-outline/20 py-3 focus:outline-none focus:border-primary transition-colors font-body text-sm"
                />
            </div>

            <PhoneInput
                dialCode={formData.phoneDialCode}
                phone={formData.phone}
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
                    className="w-full bg-surface border-b border-outline/20 py-3 focus:outline-none focus:border-primary transition-colors font-body text-sm resize-none"
                ></textarea>
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-2">
                <div className="relative flex items-start pt-1">
                    <input
                        type="checkbox"
                        name="accepted"
                        required
                        checked={formData.accepted}
                        onChange={handleChange}
                        className="peer sr-only"
                    />
                    <div className="w-4 h-4 min-w-[16px] border border-outline/50 rounded-sm bg-surface transition-all peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center">
                        <svg className="w-3 h-3 text-on-primary opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
                <span className="text-[10px] text-outline leading-relaxed text-justify">
                    Akceptuję. Dane osobowe ulegające przetwarzaniu: imię i nazwisko, adres e-mail, numer telefonu. Administratorem danych osobowych jest firma Smart Trade Sp. z o.o. z siedzibą na ul. Agnieszki Osieckiej 18, 45-807 Opole. Dane osobowe będą przetwarzane w celu odpowiedzi na zapytanie skierowane przy użyciu formularza kontaktowego oraz prowadzenie ewentualnego dalszego kontaktu na Pani/Pana życzenie.{' '}
                    <a href={`${import.meta.env.BASE_URL}privacy-policy`} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-70 transition-opacity">Polityka Prywatności</a>
                </span>
            </label>

            <button
                type="submit"
                disabled={!formData.accepted}
                className="w-full editorial-gradient text-on-primary font-label uppercase tracking-[0.2em] py-4 text-sm hover:opacity-90 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Wyślij zapytanie
            </button>
        </form>
    );
};

export default PropertyInquiryForm;
