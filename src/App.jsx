import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';

function App() {
  // ----- CONFIGURATION -----
  const startDate = new Date(2026, 5, 30);
  const members = ["Fathi", "Mejda", "Fouziya", "Hamza"];
  const DAYS_PER_PERSON = 3;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ----- PERSISTED PREFERENCES -----
  const readStored = (key, fallback) => {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  };

  // ----- STATE -----
  const today = new Date();
  const [month, setMonth] = useState(() => readStored('fr_month', today.getMonth()));
  const [year, setYear] = useState(() => readStored('fr_year', today.getFullYear()));
  const [darkMode, setDarkMode] = useState(() => readStored('fr_darkMode', false));
  const [language, setLanguage] = useState(() => readStored('fr_language', 'en'));
  const [splashVisible, setSplashVisible] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);

  // ----- TRANSLATIONS -----
  const texts = {
    en: {
      splashTitle: 'Family Rotation',
      splashText: 'Welcome to your personalized family schedule manager.',
      startBtn: 'Get Started',
      creator: 'Created by Zeghlache Mohammed',
      mainTitle: 'Family Rotation Calendar',
      membersTitle: 'Family Members',
      signature: 'Zeghlache Mohammed',
      langBtn: 'Français',
      checkBtn: 'Today',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      monthLabel: 'Month',
      yearLabel: 'Year'
    },
    fr: {
      splashTitle: 'Rotation Familiale',
      splashText: 'Bienvenue dans votre gestionnaire de programme familial personnalisé.',
      startBtn: 'Commencer',
      creator: 'Créé par Zeghlache Mohammed',
      mainTitle: 'Calendrier de Rotation Familiale',
      membersTitle: 'Membres de la famille',
      signature: 'Zeghlache Mohammed',
      langBtn: 'English',
      checkBtn: 'Aujourd\'hui',
      darkMode: 'Mode Sombre',
      lightMode: 'Mode Clair',
      monthLabel: 'Mois',
      yearLabel: 'Année'
    }
  };

  const t = texts[language];

  // ----- PERSIST PREFERENCES -----
  useEffect(() => {
    try {
      localStorage.setItem('fr_month', JSON.stringify(month));
      localStorage.setItem('fr_year', JSON.stringify(year));
      localStorage.setItem('fr_darkMode', JSON.stringify(darkMode));
      localStorage.setItem('fr_language', JSON.stringify(language));
    } catch {
      // localStorage unavailable (e.g. private browsing) - ignore silently
    }
  }, [month, year, darkMode, language]);

  // ----- SYNC BODY BACKGROUND WITH DARK MODE -----
  // The container is centered with a max-width, so the page background outside
  // it (left/right on wide screens, top/bottom padding) belongs to <body>, not
  // .app-container. Toggling the class here (once, in an effect) keeps the
  // whole viewport dark instead of just the centered content.
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    return () => document.body.classList.remove('dark-mode');
  }, [darkMode]);

  // ----- ROTATION LOGIC -----
  function daysBetween(d1, d2) {
    return Math.round((d2.getTime() - d1.getTime()) / (24 * 60 * 60 * 1000));
  }

  function getPersonForDate(date) {
    const diff = daysBetween(startDate, date);
    if (diff < 0) return "";
    const block = Math.floor(diff / DAYS_PER_PERSON);
    return members[block % members.length];
  }

  // ----- GENERATE CALENDAR (memoized: only recomputes when month/year change) -----
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();
    const now = new Date(); // computed once, not per-cell

    let dateCounter = 1;
    const rows = [];

    for (let r = 0; r < 6; r++) {
      if (dateCounter > daysInMonth) break;
      const row = [];

      for (let c = 0; c < 7; c++) {
        let dayNum, dateObj;
        let isOtherMonth = false;

        if (r === 0 && c < startWeekday) {
          const prevMonthLast = new Date(year, month, 0).getDate();
          const prevDate = prevMonthLast - (startWeekday - c - 1);
          dateObj = new Date(year, month - 1, prevDate);
          dayNum = prevDate;
          isOtherMonth = true;
        } else if (dateCounter > daysInMonth) {
          const nextDate = dateCounter - daysInMonth;
          dateObj = new Date(year, month + 1, nextDate);
          dayNum = nextDate;
          isOtherMonth = true;
          dateCounter++;
        } else {
          dateObj = new Date(year, month, dateCounter);
          dayNum = dateCounter;
          dateCounter++;
        }

        const person = getPersonForDate(dateObj);
        const isToday = now.getDate() === dateObj.getDate() &&
                       now.getMonth() === dateObj.getMonth() &&
                       now.getFullYear() === dateObj.getFullYear();

        row.push({ day: dayNum, person, isOtherMonth, isToday });
      }
      rows.push(row);
    }
    return rows;
  }, [month, year]);

  // ----- MEMBER HIGHLIGHT (React state instead of direct DOM manipulation) -----
  const handleMemberClick = useCallback((name) => {
    setSelectedMember(prev => (prev === name ? null : name));
  }, []);

  // ----- YEAR INPUT CLAMP -----
  const handleYearChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setYear('');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) setYear(num);
  };

  const handleYearBlur = () => {
    let num = parseInt(year, 10);
    if (isNaN(num)) num = today.getFullYear();
    num = Math.min(2030, Math.max(2024, num));
    setYear(num);
  };

  return (
    <>
      {/* Splash Screen */}
      {splashVisible && (
        <div className="splash-screen" id="splashScreen">
          <div className="splash-content">
            <h1 className="splash-title" id="splashTitle">{t.splashTitle}</h1>
            <p className="splash-text" id="splashText">{t.splashText}</p>
            <button className="start-btn" id="startBtn" onClick={() => setSplashVisible(false)}>
              {t.startBtn}
            </button>
            <div className="creator" id="creator">{t.creator}</div>
          </div>
        </div>
      )}

      {/* Main App */}
      <div
        className={`app-container ${darkMode ? 'dark-mode' : ''}`}
        style={{ display: splashVisible ? 'none' : 'block' }}
      >
        <div className="container">
          <div className="top-bar">
            <button
              className="mode-btn"
              id="modeBtn"
              aria-label={darkMode ? t.lightMode : t.darkMode}
              onClick={() => setDarkMode(prev => !prev)}
            >
              {darkMode ? t.lightMode : t.darkMode}
            </button>
            <button
              className="lang-btn"
              id="langBtn"
              aria-label={t.langBtn}
              onClick={() => setLanguage(prev => (prev === 'en' ? 'fr' : 'en'))}
            >
              {t.langBtn}
            </button>
          </div>
          <h1 id="mainTitle">{t.mainTitle}</h1>

          <div className="month-selector">
            <label htmlFor="monthSelect" className="visually-hidden">{t.monthLabel}</label>
            <select
              id="monthSelect"
              aria-label={t.monthLabel}
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            >
              {monthNames.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <label htmlFor="yearSelect" className="visually-hidden">{t.yearLabel}</label>
            <input
              type="number"
              id="yearSelect"
              aria-label={t.yearLabel}
              min="2024"
              max="2030"
              value={year}
              onChange={handleYearChange}
              onBlur={handleYearBlur}
            />
            <button
              id="check-btn"
              onClick={() => {
                setMonth(today.getMonth());
                setYear(today.getFullYear());
              }}
            >
              {t.checkBtn}
            </button>
          </div>

          <div className="legend">
            <div className="legend-item"><div className="legend-color legend-fathi"></div><span>Fathi</span></div>
            <div className="legend-item"><div className="legend-color legend-mejda"></div><span>Mejda</span></div>
            <div className="legend-item"><div className="legend-color legend-fouziya"></div><span>Fouziya</span></div>
            <div className="legend-item"><div className="legend-color legend-hamza"></div><span>Hamza</span></div>
          </div>

          <div className="calendar-wrapper">
            <table className="calendar" id="calendar">
              <thead>
                <tr>
                  <th>Sun</th><th>Mon</th><th>Tue</th>
                  <th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
                </tr>
              </thead>
              <tbody id="calendarBody">
                {calendarData.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => {
                      const isHighlighted = selectedMember && cell.person === selectedMember;
                      return (
                        <td
                          key={ci}
                          className={[
                            cell.isOtherMonth ? 'other-month' : '',
                            cell.isToday ? 'current-day' : '',
                            isHighlighted ? 'highlighted' : ''
                          ].filter(Boolean).join(' ')}
                        >
                          <div className="day-number">{cell.day}</div>
                          {cell.person && (
                            <div className={`person-name person-${cell.person.toLowerCase()}`}>
                              {cell.person}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="members-title" id="membersTitle">{t.membersTitle}</div>
          <div className="members-list">
            {members.map((member) => (
              <div
                key={member}
                className={`member ${selectedMember === member ? 'active' : ''}`}
                data-member={member}
                role="button"
                tabIndex={0}
                onClick={() => handleMemberClick(member)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleMemberClick(member);
                  }
                }}
              >
                {member}
              </div>
            ))}
          </div>

          <div className="signature" id="signature">{t.signature}</div>
        </div>
      </div>
    </>
  );
}

export default App;