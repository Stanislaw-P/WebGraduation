import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  ArrowRight,
  Award,
  BookOpen,
  Gamepad2,
  GraduationCap,
  Globe,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Moon,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-react'
import { Link, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import facultyLogo from './assets/logo/logo-square.png'
import facultyLogoFull from './assets/logo/logo-full.jpg'
import deanPortrait from './assets/people/dean.png'
import ExamsGame from './game/ExamsGame'
import './App.css'

type Direction =
  | 'Прикладная математика и информатика'
  | 'Информатика и вычислительная техника'
  | 'Педагогическое образование'

type Graduate = {
  id: number
  name: string
  direction: Direction
  quote: string
}

type Nomination = {
  id: number
  title: string
  winner: string
  description: string
}

type WishTone = 'blue' | 'mint' | 'lemon' | 'rose' | 'violet'

type Wish = {
  id: number
  text: string
  tone: WishTone
  x: number
  y: number
  rotate: number
}

type GameScore = {
  id: string
  playerName: string
  timeSec: number
  fives: number
  createdAt: string
}

const directions: Direction[] = [
  'Прикладная математика и информатика',
  'Информатика и вычислительная техника',
  'Педагогическое образование',
]

const graduates: Graduate[] = [
  {
    id: 1,
    name: 'Алан Кесаев',
    direction: 'Прикладная математика и информатика',
    quote: 'Если задача не решается, значит, пора переписать условие.',
  },
  {
    id: 2,
    name: 'Зарина Тедеева',
    direction: 'Информатика и вычислительная техника',
    quote: 'Главное - не забыть сохранить перед дедлайном.',
  },
  {
    id: 3,
    name: 'Сослан Битаров',
    direction: 'Педагогическое образование',
    quote: 'Объяснить сложное просто - тоже суперспособность.',
  },
  {
    id: 4,
    name: 'Мадина Дзгоева',
    direction: 'Прикладная математика и информатика',
    quote: 'Формулы тоже умеют быть красивыми.',
  },
  {
    id: 5,
    name: 'Тимур Габараев',
    direction: 'Информатика и вычислительная техника',
    quote: 'Работает? Значит, почти готово.',
  },
  {
    id: 6,
    name: 'Диана Хугаева',
    direction: 'Педагогическое образование',
    quote: 'Знания становятся сильнее, когда ими делишься.',
  },
  {
    id: 7,
    name: 'Артур Цаллагов',
    direction: 'Прикладная математика и информатика',
    quote: 'Любой хаос можно привести к системе.',
  },
  {
    id: 8,
    name: 'Элина Мамиева',
    direction: 'Информатика и вычислительная техника',
    quote: 'Лучший код - тот, который завтра не стыдно открыть.',
  },
  {
    id: 9,
    name: 'Камилла Кочиева',
    direction: 'Педагогическое образование',
    quote: 'Терпение, доска и маркер решают многое.',
  },
  {
    id: 10,
    name: 'Руслан Джиоев',
    direction: 'Прикладная математика и информатика',
    quote: 'Матрицы, кофе и уверенность в результате.',
  },
  {
    id: 11,
    name: 'Амина Басаева',
    direction: 'Информатика и вычислительная техника',
    quote: 'Баг - это приглашение подумать еще раз.',
  },
  {
    id: 12,
    name: 'Инал Дзусоев',
    direction: 'Педагогическое образование',
    quote: 'Каждый сложный пример однажды становится простым.',
  },
  {
    id: 13,
    name: 'Лаура Кулумбегова',
    direction: 'Прикладная математика и информатика',
    quote: 'Точность - это тоже форма заботы.',
  },
  {
    id: 14,
    name: 'Давид Плиев',
    direction: 'Информатика и вычислительная техника',
    quote: 'Сначала архитектура, потом паника.',
  },
  {
    id: 15,
    name: 'Милана Созиева',
    direction: 'Педагогическое образование',
    quote: 'Учиться было трудно, но рассказывать об этом будет весело.',
  },
  {
    id: 16,
    name: 'Батраз Хадарцев',
    direction: 'Прикладная математика и информатика',
    quote: 'Вероятность успеха повышается после первой попытки.',
  },
  {
    id: 17,
    name: 'Ева Туаева',
    direction: 'Информатика и вычислительная техника',
    quote: 'Коммит есть, значит, история запомнит.',
  },
  {
    id: 18,
    name: 'Георгий Кусов',
    direction: 'Педагогическое образование',
    quote: 'Главное - не переставать задавать вопросы.',
  },
]

const wishes: Wish[] = [
  {
    id: 1,
    text: 'Пусть диплом станет началом дороги, на которой будет много смелых решений и хороших людей рядом.',
    tone: 'blue',
    x: 24,
    y: 72,
    rotate: -3,
  },
  {
    id: 2,
    text: 'Спасибо за атмосферу факультета, где формулы, код и дружба спокойно помещались в один семестр.',
    tone: 'lemon',
    x: 30,
    y: 58,
    rotate: 2,
  },
  {
    id: 3,
    text: 'Желаю каждому найти дело, ради которого хочется открывать ноутбук даже без дедлайна.',
    tone: 'mint',
    x: 38,
    y: 44,
    rotate: -2,
  },
  {
    id: 4,
    text: 'Выпуск 2026, вы сделали это красиво. Дальше будет еще интереснее.',
    tone: 'rose',
    x: 32,
    y: 30,
    rotate: 4,
  },
  {
    id: 5,
    text: 'Пусть в жизни компилируется главное, а ошибки помогают становиться сильнее.',
    tone: 'violet',
    x: 21,
    y: 24,
    rotate: -4,
  },
  {
    id: 6,
    text: 'Желаю не терять любопытство, потому что именно оно однажды привело вас сюда.',
    tone: 'blue',
    x: 17,
    y: 39,
    rotate: 3,
  },
  {
    id: 7,
    text: 'Пусть рядом всегда будут люди, с которыми можно решить любую задачу.',
    tone: 'mint',
    x: 60,
    y: 42,
    rotate: -1,
  },
  {
    id: 8,
    text: 'Гордимся вами и верим, что этот выпуск еще много раз удивит факультет.',
    tone: 'lemon',
    x: 82,
    y: 35,
    rotate: 2,
  },
  {
    id: 9,
    text: 'Пусть впереди будет больше радости от результата, чем тревоги перед защитой.',
    tone: 'rose',
    x: 67,
    y: 62,
    rotate: -3,
  },
  {
    id: 10,
    text: 'Не забывайте место, где первые большие проекты начинались с пустого файла.',
    tone: 'violet',
    x: 20,
    y: 42,
    rotate: -2,
  },
  {
    id: 11,
    text: 'Желаю уверенности на собеседованиях, спокойствия в релизах и радости в обычных днях.',
    tone: 'blue',
    x: 42,
    y: 44,
    rotate: 3,
  },
  {
    id: 12,
    text: 'Пусть каждая новая глава будет сложной ровно настолько, чтобы было интересно.',
    tone: 'mint',
    x: 60,
    y: 46,
    rotate: -2,
  },
  {
    id: 13,
    text: 'Вы доказали, что математика и компьютерные науки могут быть не только трудными, но и очень живыми.',
    tone: 'lemon',
    x: 32,
    y: 86,
    rotate: 4,
  },
  {
    id: 14,
    text: 'Пусть у каждого будет проект, которым хочется гордиться без дополнительных пояснений.',
    tone: 'rose',
    x: 76,
    y: 36,
    rotate: 2,
  },
  {
    id: 15,
    text: 'Желаю помнить не только оценки и зачеты, но и людей, которые были рядом эти годы.',
    tone: 'blue',
    x: 12,
    y: 82,
    rotate: -4,
  },
  {
    id: 16,
    text: 'Пусть взрослая жизнь будет не страшной задачей, а системой, которую можно понять и улучшить.',
    tone: 'violet',
    x: 88,
    y: 70,
    rotate: 3,
  },
  {
    id: 17,
    text: 'Спасибо за смех в коридорах, ночные правки и чувство, что все это было не зря.',
    tone: 'mint',
    x: 44,
    y: 28,
    rotate: -1,
  },
  {
    id: 18,
    text: 'Пусть после выпуска будет много поводов возвращаться сюда уже с хорошими новостями.',
    tone: 'lemon',
    x: 66,
    y: 62,
    rotate: 2,
  },
]

const teacherAuthors = [
  'Руслан Черменович',
  'Преподаватель матанализа',
  'Преподаватель программирования',
  'Преподаватель алгебры',
  'Преподаватель информатики',
  'Преподаватель педагогики',
  'Преподаватель дискретной математики',
  'Преподаватель кафедры ИВТ',
  'Преподаватель факультета',
  'Преподаватель кафедры ПМИ',
  'Преподаватель операционных систем',
  'Преподаватель математической логики',
  'Преподаватель теории вероятностей',
  'Преподаватель баз данных',
  'Преподаватель численных методов',
  'Преподаватель веб-разработки',
  'Преподаватель кафедры педагогики',
  'Преподаватель факультета',
]

const nominations: Nomination[] = [
  {
    id: 1,
    title: 'Как он вообще выпустился?',
    winner: 'Алан Кесаев',
    description: 'Номинация для человека, который прошел сюжет на максимальной сложности.',
  },
  {
    id: 2,
    title: 'Топ 1 активист',
    winner: 'Элина Мамиева',
    description: 'Всегда в центре движений, мероприятий и внезапных организационных задач.',
  },
  {
    id: 3,
    title: 'Самый стильный',
    winner: 'Сослан Битаров',
    description: 'Появляется так, будто даже расписание пар согласовано с образом.',
  },
  {
    id: 4,
    title: 'Давайте в фиагдон соберемся',
    winner: 'Диана Хугаева',
    description: 'Человек, который превращает любую паузу в план большой поездки.',
  },
  {
    id: 5,
    title: 'Каждый семестр обещает начать учиться',
    winner: 'Тимур Габараев',
    description: 'И каждый семестр почти убеждает всех, что на этот раз точно начнет.',
  },
  {
    id: 6,
    title: 'Наводящий тишину',
    winner: 'Милана Созиева',
    description: 'Достаточно одного взгляда, чтобы аудитория вспомнила про дисциплину.',
  },
]

const scrollItems = [
  { label: 'Главная', id: 'hero' },
  { label: 'Выпускники', id: 'graduates-preview' },
  { label: 'Поздравления', id: 'wall' },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
}

function formatScoreTime(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(totalSeconds / 60) % 60
  const restSeconds = totalSeconds % 60
  const hours = Math.floor(totalSeconds / 3600)
  const pad = (value: number) => String(value).padStart(2, '0')

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(restSeconds)}`
    : `${pad(minutes)}:${pad(restSeconds)}`
}

function useEventState() {
  const [nominationsRevealed, setNominationsRevealedState] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadState = async () => {
    try {
      const response = await fetch('/api/event-state')

      if (!response.ok) {
        throw new Error('Не удалось получить состояние мероприятия')
      }

      const data = (await response.json()) as { nominationsRevealed?: boolean }
      setNominationsRevealedState(Boolean(data.nominationsRevealed))
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Ошибка API')
    } finally {
      setLoading(false)
    }
  }

  const setNominationsRevealed = async (revealed: boolean) => {
    setLoading(true)

    try {
      const response = await fetch(
        revealed ? '/api/admin/nominations/open' : '/api/admin/nominations/close',
        { method: 'POST' },
      )

      if (!response.ok) {
        throw new Error('Не удалось обновить состояние номинаций')
      }

      const data = (await response.json()) as { nominationsRevealed?: boolean }
      setNominationsRevealedState(Boolean(data.nominationsRevealed))
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Ошибка API')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadState()

    const intervalId = window.setInterval(() => {
      void loadState()
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [])

  return {
    nominationsRevealed,
    loading,
    error,
    refresh: loadState,
    setNominationsRevealed,
  }
}

function useAdminAuth() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSession = async () => {
    try {
      const response = await fetch('/api/admin/session')

      if (!response.ok) {
        throw new Error('Не удалось проверить вход')
      }

      const data = (await response.json()) as { authenticated?: boolean }
      setAuthenticated(Boolean(data.authenticated))
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Ошибка авторизации')
    } finally {
      setLoading(false)
    }
  }

  const login = async (loginValue: string, passwordValue: string) => {
    setLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: loginValue,
          password: passwordValue,
        }),
      })

      const data = (await response.json()) as { authenticated?: boolean; message?: string }

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось войти')
      }

      setAuthenticated(Boolean(data.authenticated))
      setError('')
    } catch (requestError) {
      setAuthenticated(false)
      setError(requestError instanceof Error ? requestError.message : 'Ошибка авторизации')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)

    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      setAuthenticated(false)
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Ошибка выхода')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSession()
  }, [])

  return {
    authenticated,
    loading,
    error,
    login,
    logout,
  }
}

function useGameLeaderboard(enabled = true) {
  const [scores, setScores] = useState<GameScore[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState('')

  const loadScores = useCallback(async () => {
    if (!enabled) {
      setScores([])
      setTotal(0)
      setLoading(false)
      setError('')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/game-scores')

      if (!response.ok) {
        throw new Error('Не удалось загрузить таблицу лидеров')
      }

      const data = (await response.json()) as { scores?: GameScore[]; total?: number }
      setScores(Array.isArray(data.scores) ? data.scores : [])
      setTotal(Number(data.total) || 0)
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Ошибка API')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void loadScores()

    if (!enabled) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      void loadScores()
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [enabled, loadScores])

  return {
    scores,
    total,
    loading,
    error,
    refresh: loadScores,
  }
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="graduates" element={<GraduatesPage />} />
        <Route path="nominations" element={<NominationsPage />} />
        <Route path="game" element={<GamePage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </Routes>
  )
}

function Layout() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return window.localStorage.getItem('graduation-theme') === 'light' ? 'light' : 'dark'
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('graduation-theme', theme)
  }, [theme])

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate(`/#${id}`)
      setMenuOpen(false)
      return
    }

    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  useEffect(() => {
    if (location.pathname === '/' && location.hash) {
      const target = location.hash.replace('#', '')
      window.setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
      }, 80)
    }
  }, [location])

  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="На главную">
          <span className="brand-mark">
            <img src={facultyLogo} alt="" />
          </span>
          <span>
            <strong>ФМКН</strong>
            <small>СОГУ</small>
          </span>
        </Link>

        <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Основная навигация">
          {scrollItems.map((item) => (
            <button key={item.id} type="button" onClick={() => scrollToSection(item.id)}>
              {item.label}
            </button>
          ))}
          <Link to="/nominations">Номинации</Link>
          <Link to="/game">Игра</Link>
        </nav>

        <div className="header-actions">
          <button
            className="icon-button"
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Переключить тему"
            title="Переключить тему"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            className="icon-button menu-button"
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Открыть меню"
            title="Меню"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <Footer />
    </>
  )
}

function HomePage() {
  const { nominationsRevealed } = useEventState()

  return (
    <>
      <section className="hero-section section-shell" id="hero">
        <div className="particle-field" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
        <div className="hero-copy">
          <div className="eyebrow">
            <GraduationCap size={18} />
            Выпуск 2026
          </div>
          <h1>Выпуск 2026 факультета математики и компьютерных наук</h1>
          <p>
            Торжественная страница выпускников СОГУ: имена, поздравления,
            номинации и цифровой архив этого дня.
          </p>
          <div className="hero-actions">
            <Link className="primary-link" to="/graduates">
              Смотреть выпускников
              <ArrowRight size={18} />
            </Link>
            <a className="secondary-link" href="#wall">
              Оставить пожелание
            </a>
          </div>
        </div>

        <div className="hero-visual" aria-label="Декоративная математическая композиция">
          <div className="faculty-logo">
            <img src={facultyLogo} alt="Логотип факультета" />
          </div>
          <span className="formula formula-one">∫f(x)dx</span>
          <span className="formula formula-two">O(n log n)</span>
          <span className="formula formula-three">f(x)=sin(2x)</span>
          <span className="code-chip">"Hello, World!"</span>
        </div>
      </section>

      <DeanSpeechSection />

      <section className="section-shell" id="graduates-preview">
        <SectionTitle
          icon={<BookOpen size={22} />}
          label="Красный диплом"
          title="Выпускники с отличием"
          text="На главной показываем 4 карточки выпускников с красным дипломом. Пока это временные данные, позже заменим их на реальные."
        />
        <div className="preview-grid honors-grid">
          {graduates.slice(0, 4).map((graduate) => (
            <GraduateCard key={graduate.id} graduate={graduate} compact />
          ))}
        </div>
        <div className="section-action">
          <Link className="text-link" to="/graduates">
            Открыть полный список
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <WallSection />

      <section className="section-shell" id="nominations-preview">
        <SectionTitle
          icon={<Award size={22} />}
          label="Номинации"
          title="Легкая часть официального вечера"
          text="Здесь будут победители заранее выбранных номинаций. Сейчас карточки временные, чтобы оценить формат."
        />
        <div className="nomination-row">
          {nominations.slice(0, 3).map((nomination) => (
            <NominationCard
              key={nomination.id}
              nomination={nomination}
              revealed={nominationsRevealed}
            />
          ))}
        </div>
        <div className="section-action">
          <Link className="text-link" to="/nominations">
            Все номинации
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="game-banner section-shell" id="game-preview">
        <div>
          <div className="eyebrow">
            <Gamepad2 size={18} />
            Игра
          </div>
          <h2>Отдельная игровая страница уже готова к подключению</h2>
          <p>Пока здесь заглушка. Позже Герман закинет игру</p>
        </div>
        <Link className="primary-link" to="/game">
          Перейти к игре
          <ArrowRight size={18} />
        </Link>
      </section>
    </>
  )
}

function DeanSpeechSection() {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="dean-section section-shell" id="dean-word">
      <div className="dean-portrait-card">
        <div className="dean-math-bg" aria-hidden="true">
          <span>ε</span>
          <span>δ</span>
          <span>lim</span>
        </div>
        <img src={deanPortrait} alt="Руслан Черменович" />
        <div className="dean-caption">
          <strong>Руслан Черменович</strong>
          <span>Декан факультета математики и компьютерных наук</span>
        </div>
      </div>

      <article className="dean-speech">
        <div className="eyebrow">
          <Sparkles size={18} />
          Слово декана
        </div>
        <h2>Дорогие выпускники факультета математики и компьютерных наук!</h2>
        <blockquote>
          Желаю вам, чтобы в жизни, как в хорошем доказательстве, всегда находился элегантный путь.
        </blockquote>

        <div className="speech-text">
          <p>
            Ну вот и всё — эпсилон-дельта окрестности остались в прошлом. Вы пережили меня, мои
            экзамены, мои замечания и бесконечные коллоквиумы.
          </p>
          <p>
            Помню, как на первом курсе многие смотрели на предел функции как на личного врага, а к
            третьему курсу — сами могли невозмутимо объяснить его первокурсникам. Это и есть рост.
          </p>

          {expanded && (
            <>
              <p>
                Пусть код компилируется, теоремы доказываются, а жизнь удивляет приятнее, чем
                неожиданный вопрос на экзамене.
              </p>
              <div className="dean-rules" aria-label="Три главных правила успешного человека">
                <span>Учиться у жизни каждый день.</span>
                <span>Ценить время и людей вокруг.</span>
                <span>Никогда не останавливаться на достигнутом.</span>
              </div>
              <p>
                С вами порой было трудно, но никогда не было скучно. Спасибо, что были моими
                студентами. Горжусь вами, а не ругаюсь (по крайней мере, вслух)!
              </p>
              <p className="speech-signature">Ваш Руслан Черменович</p>
            </>
          )}
        </div>

        <button className="read-more-button" type="button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Свернуть обращение' : 'Читать полностью'}
        </button>
      </article>
    </section>
  )
}

function WallSection() {
  return (
    <section className="wall-section section-shell" id="wall">
      <SectionTitle
        icon={<MessageSquareText size={22} />}
        label="Поздравления"
        title="Созвездие преподавателей"
        text="Наведи курсор на звезду, чтобы прочитать поздравление от преподавателей факультета."
      />

      <div className="wall-layout teacher-wall">
        <div className="wish-constellation" aria-label="Созвездие пожеланий">
          <svg className="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points="24,72 30,58 38,44 32,30 21,24 17,39 38,44" />
            <polyline points="38,44 60,42 82,35" />
            <polyline points="24,72 67,62 82,35" />
            <polyline points="60,42 67,62" />
          </svg>

          {wishes.slice(0, 9).map((wish, index) => (
            <button
              className={`wish-star ${wish.x > 66 ? 'from-right' : ''} ${
                wish.y < 45 ? 'from-top' : ''
              } is-${wish.tone}`}
              key={wish.id}
              style={{ left: `${wish.x}%`, top: `${wish.y}%` }}
              type="button"
              aria-label={`${teacherAuthors[index]}: ${wish.text}`}
            >
              <span className="star-core" />
              <span className={`wish-popover is-${wish.tone}`}>
                <strong>{teacherAuthors[index]}</strong>
                <span>{wish.text}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function GraduatesPage() {
  const [activeDirection, setActiveDirection] = useState<Direction | 'Все'>('Все')

  const visibleGraduates = useMemo(() => {
    if (activeDirection === 'Все') {
      return graduates
    }

    return graduates.filter((graduate) => graduate.direction === activeDirection)
  }, [activeDirection])

  return (
    <section className="page-shell">
      <PageIntro
        icon={<GraduationCap size={24} />}
        label="Выпускники"
        title="Список выпускников"
        text="На первом этапе здесь временные данные. Структура уже рассчитана на полный список примерно из 150 человек."
      />

      <div className="filter-bar" aria-label="Фильтр по направлениям">
        {(['Все', ...directions] as const).map((direction) => (
          <button
            key={direction}
            className={activeDirection === direction ? 'is-active' : ''}
            type="button"
            onClick={() => setActiveDirection(direction)}
          >
            {direction}
          </button>
        ))}
      </div>

      <div className="graduates-grid">
        {visibleGraduates.map((graduate) => (
          <GraduateCard key={graduate.id} graduate={graduate} />
        ))}
      </div>
    </section>
  )
}

function NominationsPage() {
  const { nominationsRevealed } = useEventState()

  return (
    <section className="page-shell">
      <PageIntro
        icon={<Award size={24} />}
        label="Номинации"
        title="Победители номинаций"
        text="Список номинаций временный. Позже заменим названия, победителей и фотографии на реальные."
      />

      <div className="nominations-grid">
        {nominations.map((nomination) => (
          <NominationCard
            key={nomination.id}
            nomination={nomination}
            revealed={nominationsRevealed}
          />
        ))}
      </div>
    </section>
  )
}

function GamePage() {
  const leaderboard = useGameLeaderboard()

  return (
    <section className="game-page page-shell">
      <PageIntro
        icon={<Gamepad2 size={24} />}
        label="Игра"
        title="Экзамены"
        text="Пройди четыре курса, переживи боссов-преподавателей и доберись до диплома."
      />

      <div className="game-layout">
        <div className="game-embed">
          <ExamsGame />
        </div>

        <GameLeaderboardCard
          error={leaderboard.error}
          loading={leaderboard.loading}
          scores={leaderboard.scores}
          total={leaderboard.total}
        />
      </div>
    </section>
  )
}

function AdminPage() {
  const { nominationsRevealed, loading, error, setNominationsRevealed } = useEventState()
  const {
    authenticated,
    loading: authLoading,
    error: authError,
    login,
    logout,
  } = useAdminAuth()
  const leaderboard = useGameLeaderboard(authenticated)
  const [loginValue, setLoginValue] = useState('')
  const [passwordValue, setPasswordValue] = useState('')
  const [leaderboardClearing, setLeaderboardClearing] = useState(false)
  const [leaderboardClearError, setLeaderboardClearError] = useState('')

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void login(loginValue, passwordValue)
  }

  const clearLeaderboard = async () => {
    if (!window.confirm('Удалить файл с результатами игры? Это действие очистит таблицу лидеров.')) {
      return
    }

    setLeaderboardClearing(true)
    setLeaderboardClearError('')

    try {
      const response = await fetch('/api/admin/game-scores/clear', { method: 'POST' })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string }
        throw new Error(data.message || 'Не удалось очистить таблицу лидеров')
      }

      await leaderboard.refresh()
    } catch (requestError) {
      setLeaderboardClearError(requestError instanceof Error ? requestError.message : 'Ошибка API')
    } finally {
      setLeaderboardClearing(false)
    }
  }

  return (
    <section className="admin-page page-shell">
      <PageIntro
        icon={<LockKeyhole size={24} />}
        label="Для организаторов"
        title="Админ-панель"
        text=""
      />

      <div className="admin-placeholder">
        {!authenticated && (
          <form className="admin-login-card" onSubmit={handleLogin}>
            <LockKeyhole size={34} />
            <div>
              <h2>Вход</h2>
              <label htmlFor="admin-login">Логин</label>
              <input
                id="admin-login"
                value={loginValue}
                onChange={(event) => setLoginValue(event.target.value)}
                placeholder="Введите логин"
                autoComplete="username"
              />
              <label htmlFor="admin-password">Пароль</label>
              <input
                id="admin-password"
                value={passwordValue}
                onChange={(event) => setPasswordValue(event.target.value)}
                type="password"
                placeholder="Введите пароль"
                autoComplete="current-password"
              />
              <button type="submit" disabled={authLoading}>
                Войти
              </button>
              {authError && <p className="admin-error">{authError}</p>}
            </div>
          </form>
        )}

        {authenticated && (
        <div className="admin-card">
          <ShieldCheck size={34} />
          <div>
            <h2>Управление номинациями</h2>
            <p>
              Открой или закрой победителей номинаций для всех пользователей сайта.
            </p>
            <div className="admin-live-control">
              <span className={nominationsRevealed ? 'status-pill is-open' : 'status-pill is-closed'}>
                {nominationsRevealed ? 'Победители открыты' : 'Победители скрыты'}
              </span>
              <div className="admin-actions">
                <button
                  type="button"
                  disabled={loading || nominationsRevealed}
                  onClick={() => void setNominationsRevealed(true)}
                >
                  Открыть победителей
                </button>
                <button
                  type="button"
                  disabled={loading || !nominationsRevealed}
                  onClick={() => void setNominationsRevealed(false)}
                >
                  Скрыть победителей
                </button>
              </div>
              {error && <p className="admin-error">{error}</p>}
              <button className="logout-button" type="button" onClick={() => void logout()}>
                Выйти
              </button>
            </div>
          </div>
        </div>
        )}

        {authenticated && (
          <GameLeaderboardCard
            admin
            clearing={leaderboardClearing}
            error={leaderboardClearError || leaderboard.error}
            loading={leaderboard.loading}
            scores={leaderboard.scores}
            total={leaderboard.total}
            onClear={() => void clearLeaderboard()}
          />
        )}
        <div className="admin-steps" aria-label="Будущий процесс обновления контента">
          <span>1. Вход организатора</span>
          <span>2. Обновление данных</span>
          <span>3. Публикация на сайте</span>
        </div>
      </div>
    </section>
  )
}

function GameLeaderboardCard({
  admin = false,
  clearing = false,
  error,
  loading,
  onClear,
  scores,
  total,
}: {
  admin?: boolean
  clearing?: boolean
  error: string
  loading: boolean
  onClear?: () => void
  scores: GameScore[]
  total: number
}) {
  return (
    <aside className={admin ? 'leaderboard-card is-admin' : 'leaderboard-card'}>
      <div className="leaderboard-head">
        <span className="leaderboard-icon">
          <Award size={22} />
        </span>
        <div>
          <span>Топ 5</span>
          <h2>Таблица лидеров</h2>
        </div>
      </div>

      {loading && <p className="leaderboard-muted">Загружаем результаты...</p>}
      {error && <p className="admin-error">{error}</p>}

      {!loading && !error && scores.length === 0 && (
        <p className="leaderboard-muted">Пока никто не получил диплом в игре.</p>
      )}

      {scores.length > 0 && (
        <ol className="leaderboard-list">
          {scores.map((score, index) => (
            <li key={score.id}>
              <span className="leaderboard-place">{index + 1}</span>
              <div>
                <strong>{score.playerName}</strong>
                <small>{score.fives} пятерок</small>
              </div>
              <time>{formatScoreTime(score.timeSec)}</time>
            </li>
          ))}
        </ol>
      )}

      {admin && (
        <div className="leaderboard-admin-tools">
          <p className="leaderboard-muted">
            Всего завершенных прохождений: {total}
          </p>
          <button
            type="button"
            disabled={clearing}
            onClick={onClear}
          >
            {clearing ? 'Очищаем...' : 'Очистить таблицу'}
          </button>
        </div>
      )}
    </aside>
  )
}

function SectionTitle({
  icon,
  label,
  title,
  text,
}: {
  icon: ReactNode
  label: string
  title: string
  text: string
}) {
  return (
    <div className="section-title">
      <div className="eyebrow">
        {icon}
        {label}
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  )
}

function PageIntro({
  icon,
  label,
  title,
  text,
}: {
  icon: ReactNode
  label: string
  title: string
  text: string
}) {
  return (
    <div className="page-intro">
      <div className="eyebrow">
        {icon}
        {label}
      </div>
      <h1>{title}</h1>
      {text && <p>{text}</p>}
    </div>
  )
}

function GraduateCard({ graduate, compact = false }: { graduate: Graduate; compact?: boolean }) {
  return (
    <article className={compact ? 'graduate-card is-compact' : 'graduate-card'}>
      <div className="avatar-placeholder">
        <span>{getInitials(graduate.name)}</span>
      </div>
      <div className="graduate-info">
        <span className="direction">{graduate.direction}</span>
        <h3>{graduate.name}</h3>
        <p>{graduate.quote}</p>
      </div>
    </article>
  )
}

function NominationCard({
  nomination,
  revealed,
}: {
  nomination: Nomination
  revealed: boolean
}) {
  return (
    <article className={revealed ? 'nomination-card is-revealed' : 'nomination-card is-locked'}>
      <div className="nomination-photo">
        {revealed ? <Award size={28} /> : <LockKeyhole size={28} />}
      </div>
      <div>
        <span>Номинация</span>
        <h3>{nomination.title}</h3>
        <strong>{revealed ? nomination.winner : 'Победитель скрыт'}</strong>
      </div>
    </article>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img src={facultyLogoFull} alt="Логотип факультета математики и компьютерных наук" />
        <div>
          <span>Выпуск 2026</span>
          <p>Северо-Осетинский государственный университет имени Коста Левановича Хетагурова</p>
        </div>
      </div>

      <div className="footer-links" aria-label="Социальные сети факультета">
        <a href="https://www.nosu.ru/facultet/it/o-fakultete/" target="_blank" rel="noreferrer">
          <Globe size={17} />
          Сайт СОГУ
        </a>
        <a href="https://vk.com/mit_nosu" target="_blank" rel="noreferrer">
          <Users size={17} />
          VK
        </a>
        <a href="https://t.me/sogu_math" target="_blank" rel="noreferrer">
          <Send size={17} />
          Telegram
        </a>
        <a href="https://max.ru/join/ljBdIp_ClpJ_xJpDjYGoImfhAFGD4MP81O3B822u_lQ" target="_blank" rel="noreferrer">
          <Radio size={17} />
          MAX
        </a>
        <Link to="/admin">
          <LockKeyhole size={17} />
          Для организаторов
        </Link>
      </div>

      <div className="footer-devs">
        <span>Разработка сайта</span>
        <p>Caucasian IT</p>
        <small>Персаев Станислав, Персаев Владислав, Тибилов Герман</small>
      </div>
    </footer>
  )
}

export default App
