import './TabMenu.css';

const CATEGORIES = [
  { id: 'music', label: 'MUSIC' },
  { id: 'movie', label: 'MOVIE' },
  { id: 'book',  label: 'BOOK'  },
];

export default function TabMenu({ activeCategory, setActiveCategory }) {
  return (
    <nav className="digging_menu">
      <ul style={{ justifyContent: 'space-evenly' }}>
        {CATEGORIES.map((cat) => (
          <li key={cat.id}>
            <h3
              className={activeCategory === cat.id ? 'active' : ''}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                fontSize: '1.4rem',
                padding: '0.6rem 1.2rem',
                color: activeCategory === cat.id ? 'var(--accent-color)' : 'var(--text-secondary)',
              }}
            >
              {cat.label}
            </h3>
          </li>
        ))}
      </ul>
    </nav>
  );
}
