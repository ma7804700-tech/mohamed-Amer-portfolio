export default function SpiderWeb({ className = '' }) {
  return (
    <svg className={`spider-web ${className}`} viewBox="0 0 280 250" fill="none" aria-hidden="true">
      <g className="spider-web-lines">
        <path d="M280 0H7M280 0 0 86M280 0 0 170M280 0 72 250M280 0 165 250M280 0V205" />
        <path d="M230 0C228 36 194 60 157 70 111 82 77 109 65 152M178 0C174 47 134 84 94 103 56 122 35 157 34 204M126 0C118 53 81 105 49 136 22 162 11 196 14 229M76 0C68 63 48 112 26 157 12 187 8 216 11 244" />
        <path d="M280 42C246 42 216 52 190 69 162 87 141 105 124 131M280 88C237 88 197 101 165 124 134 146 111 174 98 207M280 137C231 136 189 150 156 177 131 199 116 223 112 246M234 0C231 42 203 77 170 102 140 125 119 158 111 193M184 0C178 53 148 99 120 128 94 155 79 187 77 220M133 0C123 58 101 103 79 141 63 169 55 199 56 231" />
      </g>
      <g className="spider-web-spider">
        <path d="M204 126V165" />
        <ellipse cx="204" cy="174" rx="5" ry="7" />
        <circle cx="204" cy="184" r="3.4" />
        <path d="m201 171-9-7m8 12-12-1m13 5-9 8m14-17 9-7m-8 12 12-1m-13 5 9 8" />
        <circle className="spider-web-mark" cx="204" cy="174" r="1.7" />
      </g>
    </svg>
  )
}
