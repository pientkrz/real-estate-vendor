import React, { useState } from 'react';

const ContactForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        method: 'Email',
        message: '',
        accepted: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log('Form submitted:', formData);
        alert('Dziękujemy za kontakt. Przedstawiciel Global S Home skontaktuje się z Tobą wkrótce.');
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="phone" className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Numer telefonu (opcjonalnie)</label>
                        <input 
                            type="tel" 
                            id="phone" 
                            name="phone" 
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full bg-surface border-none border-b-2 border-outline/20 focus:border-primary px-4 py-3 text-on-surface font-body outline-none transition-colors duration-300 placeholder:text-outline/50"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="method" className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Preferowany kontakt</label>
                        <select
                            id="method"
                            name="method"
                            value={formData.method}
                            onChange={handleChange}
                            className="w-full bg-surface border-none border-b-2 border-outline/20 focus:border-primary px-4 py-3 text-on-surface font-body outline-none transition-colors duration-300 appearance-none cursor-pointer"
                        >
                            <option value="Email">E-mail</option>
                            <option value="Phone">Telefon</option>
                            <option value="WhatsApp">WhatsApp</option>
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
                        disabled={!formData.accepted}
                        className="w-full editorial-gradient text-on-primary font-label uppercase tracking-[0.2em] py-4 text-sm hover:opacity-90 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Wyślij zapytanie
                    </button>
                    <p className="text-center text-[10px] font-label text-outline mt-4 uppercase tracking-wider">
                        Twoje dane są w pełni poufne.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default ContactForm;
