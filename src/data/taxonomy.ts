import { UserProfile, Project, MatchDetails } from '../types.ts';

// 1. FIXED DOMAINS
export const FIXED_DOMAINS = [
  'IoT',
  'Smart Home',
  'Embedded Systems',
  'Robotics',
  'AI/ML',
  'Web Development',
  'Mobile Apps',
  'Cybersecurity',
  'Fintech',
  'HealthTech',
  'EdTech',
  'Game Dev',
  'Data Science',
  'Sustainability',
  'Other',
] as const;

export type DomainType = (typeof FIXED_DOMAINS)[number];
export const DOMAIN_INTERESTS: string[] = [...FIXED_DOMAINS];

// 2. FIXED ROLES (with 'Embedded/Firmware Developer' correctly spelled, fixing 'EmbeddedlFirmware')
export const FIXED_ROLES = [
  'Embedded/Firmware Developer',
  'Hardware/Circuit Engineer',
  'IoT Engineer',
  'Mobile App Developer',
  'Frontend Developer',
  'Backend Developer',
  'ML Engineer',
  'UI/UX Designer',
  'Data Analyst',
  'Project Manager',
  'Other',
] as const;

export type RoleType = (typeof FIXED_ROLES)[number];
export const PREFERRED_ROLES: string[] = [...FIXED_ROLES];

// 3. CANONICAL SKILL DEFINITION & TAXONOMY
export interface CanonicalSkill {
  id: string;
  name: string;
  category:
    | 'Hardware & Embedded'
    | 'Languages'
    | 'Frontend'
    | 'Backend & Databases'
    | 'AI & Machine Learning'
    | 'DevOps & Cloud'
    | 'Mobile'
    | 'Design & Prototyping'
    | 'Other';
  aliases: string[];
}

export const CANONICAL_SKILLS: CanonicalSkill[] = [
  // --- Hardware & Embedded (Complete coverage requested) ---
  {
    id: 'esp32',
    name: 'ESP32',
    category: 'Hardware & Embedded',
    aliases: ['esp-32', 'esp 32', 'esp32-s3', 'esp32-c3', 'esp8266', 'nodemcu', 'espressif'],
  },
  {
    id: 'arduino',
    name: 'Arduino',
    category: 'Hardware & Embedded',
    aliases: ['arduino ide', 'arduino uno', 'arduino mega', 'arduino nano', 'arduino pro mini'],
  },
  {
    id: 'ds18b20',
    name: 'DS18B20',
    category: 'Hardware & Embedded',
    aliases: ['ds18b20 sensor', 'ds1820', 'temperature sensor ds18b20', 'ds18b20 temp'],
  },
  {
    id: 'relays',
    name: 'Relays',
    category: 'Hardware & Embedded',
    aliases: ['relay', 'relay module', '5v relay', 'solid state relay', 'ssr', 'relay control'],
  },
  {
    id: 'onewire',
    name: 'OneWire',
    category: 'Hardware & Embedded',
    aliases: ['1-wire', 'onewire protocol', '1 wire', 'one wire bus', 'w1 protocol'],
  },
  {
    id: 'watchdog-timers',
    name: 'Watchdog Timers',
    category: 'Hardware & Embedded',
    aliases: ['watchdog timer', 'wdt', 'watchdog', 'hardware watchdog', 'software watchdog', 'iwdg'],
  },
  {
    id: 'circuit-design',
    name: 'Circuit Design',
    category: 'Hardware & Embedded',
    aliases: ['schematic design', 'circuit diagram', 'circuitry', 'breadboarding', 'analog circuits'],
  },
  {
    id: 'pcb',
    name: 'PCB',
    category: 'Hardware & Embedded',
    aliases: ['pcb design', 'printed circuit board', 'kicad', 'altium', 'eagle pcb', 'easyeda', 'gerber'],
  },
  {
    id: 'sensors',
    name: 'Sensors',
    category: 'Hardware & Embedded',
    aliases: [
      'sensor integration',
      'i2c sensors',
      'spi sensors',
      'analog sensors',
      'dht22',
      'dht11',
      'mpu6050',
      'bme280',
      'ultrasonic sensor',
      'hc-sr04',
      'accelerometer',
      'gyroscope',
      'imu',
    ],
  },
  {
    id: 'raspberry-pi',
    name: 'Raspberry Pi',
    category: 'Hardware & Embedded',
    aliases: ['rpi', 'raspi', 'raspberry pi 4', 'raspberry pi 5', 'raspberry pi pico', 'pico w'],
  },
  {
    id: 'microcontrollers',
    name: 'Microcontrollers / STM32',
    category: 'Hardware & Embedded',
    aliases: ['mcu', 'stm32', 'avr', 'pic', 'arm cortex', 'embedded systems', 'cortex-m', 'bare metal'],
  },
  {
    id: 'i2c',
    name: 'I2C',
    category: 'Hardware & Embedded',
    aliases: ['i2c bus', 'twi', 'iic', 'inter-integrated circuit'],
  },
  {
    id: 'spi',
    name: 'SPI',
    category: 'Hardware & Embedded',
    aliases: ['spi bus', 'serial peripheral interface'],
  },
  {
    id: 'uart',
    name: 'UART',
    category: 'Hardware & Embedded',
    aliases: ['serial', 'rs232', 'usart', 'baud rate', 'serial communication'],
  },
  {
    id: 'pwm',
    name: 'PWM',
    category: 'Hardware & Embedded',
    aliases: ['pulse width modulation', 'pwm control', 'motor control'],
  },
  {
    id: 'lorawan',
    name: 'LoRaWAN',
    category: 'Hardware & Embedded',
    aliases: ['lora', 'lorawan network', 'ttn', 'the things network', 'long range radio'],
  },
  {
    id: 'ble',
    name: 'BLE / Bluetooth',
    category: 'Hardware & Embedded',
    aliases: ['ble', 'bluetooth low energy', 'bluetooth', 'bluetooth 5.0'],
  },
  {
    id: 'mqtt',
    name: 'MQTT',
    category: 'Hardware & Embedded',
    aliases: ['mqtt protocol', 'mosquitto', 'hivemq', 'emqx', 'pub/sub iot'],
  },
  {
    id: 'ros2',
    name: 'ROS2',
    category: 'Hardware & Embedded',
    aliases: ['ros', 'robot operating system', 'ros 2', 'robotics'],
  },
  {
    id: 'soldering',
    name: 'Soldering & Assembly',
    category: 'Hardware & Embedded',
    aliases: ['soldering', 'soldering iron', 'hardware prototyping', 'smd soldering'],
  },

  // --- Languages ---
  {
    id: 'cpp',
    name: 'C++',
    category: 'Languages',
    aliases: ['cpp', 'c plus plus', 'c/c++', 'modern c++'],
  },
  {
    id: 'c',
    name: 'C',
    category: 'Languages',
    aliases: ['c language', 'embedded c', 'ansi c'],
  },
  {
    id: 'python',
    name: 'Python',
    category: 'Languages',
    aliases: ['py', 'python3', 'python 3'],
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'Languages',
    aliases: ['ts', 'typescript language'],
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    category: 'Languages',
    aliases: ['js', 'es6', 'ecmascript'],
  },
  {
    id: 'rust',
    name: 'Rust',
    category: 'Languages',
    aliases: ['rustlang', 'cargo'],
  },
  {
    id: 'go',
    name: 'Go',
    category: 'Languages',
    aliases: ['golang'],
  },
  {
    id: 'java',
    name: 'Java',
    category: 'Languages',
    aliases: ['java 17', 'java 21', 'spring boot'],
  },
  {
    id: 'sql',
    name: 'SQL',
    category: 'Languages',
    aliases: ['relational db', 'mysql', 'sqlite', 'mariadb'],
  },
  {
    id: 'solidity',
    name: 'Solidity',
    category: 'Languages',
    aliases: ['smart contracts', 'ethereum', 'web3'],
  },

  // --- Frameworks & Frontend ---
  {
    id: 'react',
    name: 'React',
    category: 'Frontend',
    aliases: ['reactjs', 'react.js', 'react 19'],
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'Frontend',
    aliases: ['nextjs', 'next', 'next.js 14', 'next.js 15'],
  },
  {
    id: 'vue',
    name: 'Vue.js',
    category: 'Frontend',
    aliases: ['vue', 'vuejs', 'vue 3', 'nuxt'],
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    category: 'Frontend',
    aliases: ['tailwind', 'tailwindcss', 'tailwind 4'],
  },
  {
    id: 'threejs',
    name: 'Three.js',
    category: 'Frontend',
    aliases: ['three', 'webgl', '3d graphics'],
  },
  {
    id: 'html-css',
    name: 'HTML/Canvas',
    category: 'Frontend',
    aliases: ['html5', 'canvas', 'svg'],
  },

  // --- Backend & Databases ---
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'Backend & Databases',
    aliases: ['node', 'nodejs'],
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    category: 'Backend & Databases',
    aliases: ['fast api', 'fastapi python'],
  },
  {
    id: 'express',
    name: 'Express',
    category: 'Backend & Databases',
    aliases: ['express.js', 'expressjs'],
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'Backend & Databases',
    aliases: ['postgres', 'psql'],
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'Backend & Databases',
    aliases: ['mongo'],
  },
  {
    id: 'firebase',
    name: 'Firebase/Firestore',
    category: 'Backend & Databases',
    aliases: ['firebase', 'firestore', 'google firebase'],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'Backend & Databases',
    aliases: ['supabase db'],
  },
  {
    id: 'redis',
    name: 'Redis',
    category: 'Backend & Databases',
    aliases: ['redis cache'],
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    category: 'Backend & Databases',
    aliases: ['gql', 'apollo'],
  },

  // --- AI & Machine Learning ---
  {
    id: 'pytorch',
    name: 'PyTorch',
    category: 'AI & Machine Learning',
    aliases: ['torch'],
  },
  {
    id: 'tensorflow',
    name: 'TensorFlow',
    category: 'AI & Machine Learning',
    aliases: ['tf', 'keras'],
  },
  {
    id: 'gemini-api',
    name: 'Gemini API',
    category: 'AI & Machine Learning',
    aliases: ['gemini', 'google genai', 'google ai', '@google/genai'],
  },
  {
    id: 'langchain',
    name: 'LangChain',
    category: 'AI & Machine Learning',
    aliases: ['lang chain', 'langgraph'],
  },
  {
    id: 'opencv-yolo',
    name: 'Computer Vision (OpenCV/YOLO)',
    category: 'AI & Machine Learning',
    aliases: ['opencv', 'yolo', 'cv', 'computer vision', 'object detection'],
  },
  {
    id: 'nlp',
    name: 'NLP',
    category: 'AI & Machine Learning',
    aliases: ['natural language processing', 'llms', 'large language models', 'rag', 'embeddings'],
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    category: 'AI & Machine Learning',
    aliases: ['transformers', 'hf'],
  },
  {
    id: 'scikit-learn',
    name: 'Scikit-Learn',
    category: 'AI & Machine Learning',
    aliases: ['sklearn'],
  },

  // --- DevOps & Cloud ---
  {
    id: 'docker',
    name: 'Docker',
    category: 'DevOps & Cloud',
    aliases: ['docker container', 'dockerfile', 'compose'],
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    category: 'DevOps & Cloud',
    aliases: ['k8s'],
  },
  {
    id: 'git-github',
    name: 'Git / GitHub',
    category: 'DevOps & Cloud',
    aliases: ['git', 'github', 'github actions', 'version control'],
  },
  {
    id: 'aws',
    name: 'AWS',
    category: 'DevOps & Cloud',
    aliases: ['amazon web services', 's3', 'lambda', 'ec2'],
  },
  {
    id: 'gcp',
    name: 'Google Cloud',
    category: 'DevOps & Cloud',
    aliases: ['gcp', 'google cloud platform'],
  },
  {
    id: 'linux',
    name: 'Linux',
    category: 'DevOps & Cloud',
    aliases: ['linux bash', 'unix', 'shell', 'bash'],
  },

  // --- Mobile ---
  {
    id: 'react-native',
    name: 'React Native',
    category: 'Mobile',
    aliases: ['react-native', 'rn', 'expo'],
  },
  {
    id: 'flutter',
    name: 'Flutter',
    category: 'Mobile',
    aliases: ['dart'],
  },
  {
    id: 'ios-swift',
    name: 'iOS / Swift',
    category: 'Mobile',
    aliases: ['swift', 'swiftui', 'ios'],
  },
  {
    id: 'android-kotlin',
    name: 'Android / Kotlin',
    category: 'Mobile',
    aliases: ['kotlin', 'android', 'jetpack compose'],
  },

  // --- Design & Prototyping ---
  {
    id: 'figma',
    name: 'Figma',
    category: 'Design & Prototyping',
    aliases: ['ui/ux', 'ui design', 'prototyping', 'wireframing'],
  },
  {
    id: 'unity',
    name: 'Unity',
    category: 'Other',
    aliases: ['unity3d', 'unity engine'],
  },
  {
    id: 'unreal-engine',
    name: 'Unreal Engine',
    category: 'Other',
    aliases: ['unreal', 'ue5'],
  },
];

// Flat list of canonical skill names for dropdowns and auto-suggests
export const ALL_SKILLS: string[] = CANONICAL_SKILLS.map((s) => s.name);

export const SKILL_CATEGORIES: { name: string; skills: string[] }[] = [
  {
    name: 'Hardware & Embedded',
    skills: [
      'ESP32',
      'Arduino',
      'DS18B20',
      'Relays',
      'OneWire',
      'Watchdog Timers',
      'Circuit Design',
      'PCB',
      'Sensors',
      'Raspberry Pi',
      'Microcontrollers / STM32',
      'I2C',
      'SPI',
      'UART',
      'LoRaWAN',
      'BLE / Bluetooth',
      'MQTT',
      'ROS2',
      'C++',
      'C',
    ],
  },
  {
    name: 'Languages & Core',
    skills: ['Python', 'TypeScript', 'JavaScript', 'C++', 'C', 'Rust', 'Go', 'Java', 'SQL', 'Solidity'],
  },
  {
    name: 'Frontend',
    skills: ['React', 'Next.js', 'Vue.js', 'Tailwind CSS', 'Three.js', 'HTML/Canvas'],
  },
  {
    name: 'Backend & Cloud',
    skills: ['Node.js', 'FastAPI', 'Express', 'PostgreSQL', 'MongoDB', 'Firebase/Firestore', 'Supabase', 'Docker', 'AWS', 'Google Cloud', 'Linux'],
  },
  {
    name: 'AI & Machine Learning',
    skills: ['PyTorch', 'TensorFlow', 'Gemini API', 'LangChain', 'Computer Vision (OpenCV/YOLO)', 'NLP', 'Hugging Face', 'Scikit-Learn'],
  },
  {
    name: 'Mobile & Design',
    skills: ['React Native', 'Flutter', 'iOS / Swift', 'Android / Kotlin', 'Figma'],
  },
];

// Fast alias lookup index: normalized string -> CanonicalSkill
const ALIAS_LOOKUP_MAP: Map<string, CanonicalSkill> = new Map();

function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[-_./]/g, ' ')
    .replace(/\s+/g, ' ');
}

// Build the index
CANONICAL_SKILLS.forEach((skill) => {
  ALIAS_LOOKUP_MAP.set(normalizeStr(skill.name), skill);
  ALIAS_LOOKUP_MAP.set(skill.name.toLowerCase().trim(), skill);
  skill.aliases.forEach((alias) => {
    ALIAS_LOOKUP_MAP.set(normalizeStr(alias), skill);
    ALIAS_LOOKUP_MAP.set(alias.toLowerCase().trim(), skill);
  });
});

/**
 * Resolves any skill string (e.g. "arduino IDE", "esp-32", "CustomAlgo")
 * to its canonical representation, or marks it as custom.
 */
export function resolveSkill(input: string): {
  canonicalName: string;
  isCustom: boolean;
  category?: string;
} {
  const trimmed = input.trim();
  if (!trimmed) return { canonicalName: '', isCustom: false };

  const norm = normalizeStr(trimmed);
  const found = ALIAS_LOOKUP_MAP.get(norm) || ALIAS_LOOKUP_MAP.get(trimmed.toLowerCase());

  if (found) {
    return {
      canonicalName: found.name,
      isCustom: false,
      category: found.category,
    };
  }

  // Not found in canonical list or aliases -> custom entry
  return {
    canonicalName: trimmed,
    isCustom: true,
  };
}

// 4. ONE-CLICK SUGGESTED SKILL CHIPS PER DOMAIN
export const DOMAIN_SUGGESTED_SKILLS: Record<string, string[]> = {
  IoT: ['ESP32', 'Arduino', 'C++', 'Sensors', 'Relays', 'OneWire', 'DS18B20', 'MQTT'],
  'Smart Home': ['ESP32', 'Relays', 'Sensors', 'MQTT', 'Raspberry Pi', 'BLE / Bluetooth'],
  'Embedded Systems': ['C++', 'C', 'Microcontrollers / STM32', 'Watchdog Timers', 'PCB', 'Circuit Design', 'I2C', 'SPI'],
  Robotics: ['ROS2', 'Python', 'C++', 'Arduino', 'Sensors', 'Computer Vision (OpenCV/YOLO)'],
  'AI/ML': ['Python', 'PyTorch', 'TensorFlow', 'Gemini API', 'LangChain', 'NLP', 'Computer Vision (OpenCV/YOLO)'],
  'Web Development': ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Node.js', 'PostgreSQL'],
  'Mobile Apps': ['React Native', 'Flutter', 'iOS / Swift', 'Android / Kotlin', 'Firebase/Firestore'],
  Cybersecurity: ['Linux', 'Python', 'Cryptography', 'Penetration Testing', 'Git / GitHub'],
  Fintech: ['TypeScript', 'PostgreSQL', 'FastAPI', 'Python', 'Solidity'],
  HealthTech: ['Python', 'Sensors', 'React', 'FastAPI', 'DS18B20', 'PostgreSQL'],
  EdTech: ['React', 'Next.js', 'Node.js', 'TypeScript', 'Tailwind CSS'],
  'Game Dev': ['Unity', 'Unreal Engine', 'C++', 'Three.js'],
  'Data Science': ['Python', 'SQL', 'Scikit-Learn', 'PyTorch', 'PostgreSQL'],
  Sustainability: ['IoT', 'Sensors', 'Python', 'ESP32', 'LoRaWAN', 'DS18B20'],
  Other: ['Git / GitHub', 'Docker', 'Linux', 'Python'],
};

// 5. DETERMINISTIC SCORING ENGINE
// Computes score in code, NOT with an LLM:
// - 50% weighted overlap between user's skills and project's required skills
// - 25% role match against open roles
// - 15% domain overlap
// - 10% skill-level fit and GitHub evidence
export function computeDeterministicMatch(
  userProfile: UserProfile,
  project: Project
): MatchDetails {
  // 1. 50% SKILLS OVERLAP (Only non-custom skills are scored)
  const userValidSkills = (userProfile.skills || [])
    .filter((s) => !s.isCustom)
    .map((s) => resolveSkill(s.name).canonicalName.toLowerCase());

  const projSkillsRaw = project.techStack || [];
  const projCanonicalSkills = projSkillsRaw.map((t) => resolveSkill(t).canonicalName);
  const projUniqueSkills = Array.from(new Set(projCanonicalSkills));

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  projUniqueSkills.forEach((projSkill) => {
    if (userValidSkills.includes(projSkill.toLowerCase())) {
      matchedSkills.push(projSkill);
    } else {
      missingSkills.push(projSkill);
    }
  });

  const skillOverlapRatio =
    projUniqueSkills.length > 0 ? matchedSkills.length / projUniqueSkills.length : 0.5;
  const skillsScore = skillOverlapRatio * 50; // max 50 pts

  // 2. 25% ROLE MATCH AGAINST OPEN ROLES
  const openRoles = (project.openRoles || [])
    .filter((r) => !r.filled)
    .map((r) => r.role);
  const userRoles = userProfile.preferredRoles || [];

  let bestFitRole: string | null = null;
  let exactRoleMatch = false;

  // Search exact match
  for (const uRole of userRoles) {
    const direct = openRoles.find((o) => o.toLowerCase() === uRole.toLowerCase());
    if (direct) {
      bestFitRole = direct;
      exactRoleMatch = true;
      break;
    }
  }

  // Search partial / related match
  if (!bestFitRole && userRoles.length > 0 && openRoles.length > 0) {
    for (const uRole of userRoles) {
      const u = uRole.toLowerCase();
      const partial = openRoles.find((o) => {
        const oL = o.toLowerCase();
        return (
          u.includes(oL) ||
          oL.includes(u) ||
          (u.includes('firmware') && oL.includes('embedded')) ||
          (u.includes('embedded') && oL.includes('firmware')) ||
          (u.includes('circuit') && oL.includes('hardware')) ||
          (u.includes('hardware') && oL.includes('circuit')) ||
          (u.includes('frontend') && oL.includes('web')) ||
          (u.includes('backend') && oL.includes('web')) ||
          (u.includes('ml') && oL.includes('data'))
        );
      });
      if (partial) {
        bestFitRole = partial;
        break;
      }
    }
  }

  if (!bestFitRole && openRoles.length > 0) {
    bestFitRole = openRoles[0];
  }

  let roleScore = 0;
  if (exactRoleMatch) {
    roleScore = 25;
  } else if (bestFitRole && openRoles.includes(bestFitRole)) {
    roleScore = 16;
  } else if (openRoles.length === 0) {
    roleScore = 12.5; // neutral if all roles filled
  } else {
    roleScore = 5;
  }

  // 3. 15% DOMAIN OVERLAP
  const projDomains =
    project.domains && project.domains.length > 0
      ? project.domains
      : project.domain
      ? [project.domain]
      : [];
  const userDomains = userProfile.domainInterests || [];

  const matchedDomains = projDomains.filter((pd) =>
    userDomains.some((ud) => ud.toLowerCase() === pd.toLowerCase())
  );

  const domainRatio =
    projDomains.length > 0
      ? matchedDomains.length / projDomains.length
      : userDomains.length > 0
      ? 0.5
      : 0;
  const domainScore = Math.min(15, domainRatio * 15);

  // 4. 10% SKILL-LEVEL FIT & GITHUB EVIDENCE
  let fitScore = 0;
  if (userProfile.githubVerified) {
    fitScore += 5;
  } else if (userProfile.linkedinVerified) {
    fitScore += 3;
  }

  const reqLevel = project.skillLevelRequired || 'intermediate';
  const levels = (userProfile.skills || []).map((s) => s.level);
  const advCount = levels.filter((l) => l === 'advanced').length;
  const intCount = levels.filter((l) => l === 'intermediate').length;
  const userAvgLevel = advCount >= 2 ? 'advanced' : intCount >= 2 ? 'intermediate' : 'beginner';

  if (reqLevel === 'any' || reqLevel === userAvgLevel) {
    fitScore += 5;
  } else if (
    (reqLevel === 'beginner' && (userAvgLevel === 'intermediate' || userAvgLevel === 'advanced')) ||
    (reqLevel === 'intermediate' && userAvgLevel === 'advanced')
  ) {
    fitScore += 5;
  } else {
    fitScore += 2;
  }

  // Total deterministic calculation (0 - 100)
  const total = Math.min(99, Math.max(15, Math.round(skillsScore + roleScore + domainScore + fitScore)));

  // Instant fallback one-sentence explanation
  let fallbackReason = `Direct match on ${matchedSkills.length} required skill${matchedSkills.length === 1 ? '' : 's'}${bestFitRole ? ` for ${bestFitRole}` : ''}.`;
  if (matchedSkills.length === 0) {
    fallbackReason = `Opportunity to build skills in ${projUniqueSkills.slice(0, 2).join(' and ')}${bestFitRole ? ` as ${bestFitRole}` : ''}.`;
  }

  return {
    matchScore: total,
    matchedSkills,
    missingSkills,
    bestFitRole,
    matchReason: fallbackReason,
    skillsScore: Math.round(skillsScore),
    roleScore: Math.round(roleScore),
    domainScore: Math.round(domainScore),
    fitScore: Math.round(fitScore),
  };
}

// 6. GOALS
export const GOALS: { id: string; label: string; description: string }[] = [
  { id: 'win a hackathon', label: 'Win a Hackathon', description: 'Competitive sprint to take 1st place and prize tracks' },
  { id: 'learn', label: 'Learn & Level Up', description: 'Experiment with cutting-edge tools and learn from peers' },
  { id: 'build portfolio', label: 'Build Portfolio', description: 'Ship a polished open-source showcase project' },
  { id: 'network', label: 'Network & Meet Friends', description: 'Connect with driven builders and industry judges' },
  { id: 'find long-term collaborators', label: 'Find Co-founders', description: 'Scout teammates for a startup or research venture' },
];
