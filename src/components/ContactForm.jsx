import React, { useState } from 'react';
import PhoneInput from './PhoneInput';
import { isValidPhoneNumber } from '../utils/phoneValidation';

const ContactForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        direction: '',
        purpose: '',
        budget: '',
        propertyType: '',
        message: '',
        accepted: false
    });
    const [phoneError, setPhoneError] = useState('');
    const [status, setStatus] = useState('idle'); // idle | submitting | success | error
    const [statusMessage, setStatusMessage] = useState('');

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
        if (!validatePhone()) return;

        setStatus('submitting');
        try {
            const traceparent = window.__globalSHomeCreateChildTraceparent?.();
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(traceparent ? { traceparent } : {}) },
                body: JSON.stringify({
                    ...formData,
                    source: 'contact',
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

    return (
        <div className="w-full max-w-2xl mx-auto bg-surface-container-low p-10 md:p-14 shadow-2xl relative overflow-hidden">
            {/* Architectural accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-inverse-primary" />
            
            <div className="mb-10 text-center">
                <span className="text-primary font-label text-xs tracking-[0.2em] uppercase mb-4 block">Prywatna konsultacja</span>
                <h2 className="text-4xl md:text-5xl font-headline font-bold text-on-surface tracking-tighter">Skontaktuj się z nami</h2>
                <p className="mt-4 text-on-surface-variant font-body text-sm md:text-base leading-relaxed max-w-md mx-auto">
                    Dyskrecja i precyzja to nasze znaki rozpoznawcze. Zostaw swoje dane, a nasi wyspecjalizowani agenci umówią prywatne spotkanie.
                </p>
            </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Imię i nazwisko</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-surface border-none border-b-2 border-outline/20 focus:border-primary px-4 py-3 text-on-surface font-body outline-none transition-colors duration-300 placeholder:text-outline/50"
                            placeholder="np. Jan Kowalski"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Adres e-mail</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-surface border-none border-b-2 border-outline/20 focus:border-primary px-4 py-3 text-on-surface font-body outline-none transition-colors duration-300 placeholder:text-outline/50"
                            placeholder="eleanor@example.com"
                        />
                    </div>
                </div>

                <PhoneInput
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={validatePhone}
                    error={phoneError}
                    label="Nr telefonu"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="direction" className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Kierunek</label>
                        <select
                            id="direction"
                            name="direction"
                            value={formData.direction}
                            onChange={handleChange}
                            className="w-full bg-surface border-none border-b-2 border-outline/20 focus:border-primary px-4 py-3 text-on-surface font-body outline-none transition-colors duration-300 appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Wybierz kierunek</option>
                            <option value="Greece">Grecja</option>
                            <option value="Spain">Hiszpania</option>
                            <option value="Cyprus">Cypr</option>
                            <option value="Poland">Polska</option>
                            <option value="UAE">Zjednoczone Emiraty Arabskie</option>
                            <option value="Italy">Włochy</option>
                            <option value="Other">Inny</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="purpose" className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Cel zakupu</label>
                        <select
                            id="purpose"
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleChange}
                            className="w-full bg-surface border-none border-b-2 border-outline/20 focus:border-primary px-4 py-3 text-on-surface font-body outline-none transition-colors duration-300 appearance-none cursor-pointer"
                        >
                            <option value="">Wybierz cel</option>
                            <option value="Investment">Inwestycja</option>
                            <option value="Personal">Użytek własny</option>
                            <option value="Vacation">Dom wakacyjny</option>
                            <option value="Relocation">Przeprowadzka</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="budget" className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Budżet (PLN)</label>
                        <input
                            type="text"
                            id="budget"
                            name="budget"
                            value={formData.budget}
                            onChange={handleChange}
                            className="w-full bg-surface border-none border-b-2 border-outline/20 focus:border-primary px-4 py-3 text-on-surface font-body outline-none transition-colors duration-300 placeholder:text-outline/50"
                            placeholder="np. 500 000"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="propertyType" className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Preferowany typ nieruchomości</label>
                        <select
                            id="propertyType"
                            name="propertyType"
                            value={formData.propertyType}
                            onChange={handleChange}
                            className="w-full bg-surface border-none border-b-2 border-outline/20 focus:border-primary px-4 py-3 text-on-surface font-body outline-none transition-colors duration-300 appearance-none cursor-pointer"
                        >
                            <option value="">Wybierz typ</option>
                            <option value="mieszkania">Mieszkanie</option>
                            <option value="domy">Dom</option>
                            <option value="dzialki">Działka</option>
                            <option value="pokoje">Pokój</option>
                            <option value="lokale">Lokal</option>
                            <option value="hale">Hala</option>
                            <option value="garaze">Garaż</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <label htmlFor="message" className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Treść zapytania</label>
                    <textarea
                        id="message"
                        name="message"
                        rows="4"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full bg-surface border-none border-b-2 border-outline/20 focus:border-primary px-4 py-3 text-on-surface font-body outline-none transition-colors duration-300 resize-none placeholder:text-outline/50"
                        placeholder="Opisz nieruchomość, której szukasz lub którą chcesz wystawić..."
                    ></textarea>
                </div>

                <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
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
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={!formData.accepted || status === 'submitting'}
                        className="w-full editorial-gradient text-on-primary font-label uppercase tracking-[0.2em] py-4 text-sm hover:opacity-90 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'submitting' ? 'Wysyłanie...' : 'Wyślij zapytanie'}
                    </button>
                    {status === 'success' && (
                        <p className="text-center text-sm text-primary font-body mt-4">
                            Dziękujemy za kontakt. Przedstawiciel Global S Home skontaktuje się z Tobą wkrótce.
                        </p>
                    )}
                    {status === 'error' && (
                        <p className="text-center text-sm text-red-600 font-body mt-4">
                            {statusMessage}
                        </p>
                    )}
                    <p className="text-center text-[10px] font-label text-outline mt-4 uppercase tracking-wider">
                        Twoje dane są w pełni poufne.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default ContactForm;
