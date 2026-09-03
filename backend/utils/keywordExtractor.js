/**
 * Intelligent Keyword & Skill Extractor for Job Postings and Alumni Preferences
 */

// Dictionary of known technical skills, domains, and keywords
const KNOWN_KEYWORDS = [
    // Programming Languages
    'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Golang', 'Go', 'Rust', 'Ruby', 'PHP', 
    'Swift', 'Kotlin', 'Dart', 'R', 'MATLAB', 'Scala', 'HTML', 'HTML5', 'CSS', 'CSS3', 'SQL', 'NoSQL',
    
    // Frameworks & Libraries
    'React', 'React Native', 'Node.js', 'NodeJS', 'Express', 'Django', 'Flask', 'FastAPI', 
    'Spring Boot', 'Spring', 'Vue', 'Vue.js', 'Angular', 'Next.js', 'Flutter', 'PyTorch', 
    'TensorFlow', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Tailwind', 'Bootstrap', 'GraphQL',
    'Redux', 'REST API', 'RESTful',
    
    // Cloud & DevOps
    'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 
    'CI/CD', 'Terraform', 'Linux', 'Microservices', 'Serverless', 'Jenkins', 'Git', 'GitHub', 'DevOps',
    
    // Data & AI / ML
    'Machine Learning', 'Artificial Intelligence', 'AI', 'Deep Learning', 'Data Science', 
    'Data Analytics', 'Data Engineering', 'NLP', 'Natural Language Processing', 'Computer Vision', 
    'Big Data', 'Spark', 'Hadoop', 'Kafka', 'PowerBI', 'Tableau', 'LLMs', 'Generative AI',
    
    // Databases
    'MongoDB', 'PostgreSQL', 'Postgres', 'MySQL', 'Redis', 'DynamoDB', 'Oracle', 'Elasticsearch', 
    'Firebase', 'Supabase', 'Cassandra',
    
    // Engineering & Hardware
    'VLSI', 'Embedded Systems', 'IoT', 'Robotics', 'MATLAB', 'Simulink', 'Verilog', 'VHDL', 
    'PCB Design', 'FPGA', 'AutoCAD', 'SolidWorks', 'ANSYS',
    
    // Design & Product
    'UI/UX', 'UI Design', 'UX Design', 'Figma', 'Adobe XD', 'Product Management', 'Agile', 'Scrum',
    
    // Security
    'Cybersecurity', 'Ethical Hacking', 'Penetration Testing', 'Network Security', 'Cryptography',
    'SOC', 'SIEM', 'Zero Trust',

    // Business & Management
    'Finance', 'Marketing', 'SEO', 'Operations', 'Business Analyst', 'Consulting'
];

/**
 * Automatically extract relevant keywords from job title, description, and requirements
 * @param {string} title
 * @param {string} description
 * @param {Array<string>} requirements
 * @returns {Array<string>} Array of unique detected keywords
 */
function extractKeywords(title = '', description = '', requirements = []) {
    const combinedText = [
        title,
        description,
        Array.isArray(requirements) ? requirements.join(' ') : String(requirements || '')
    ].join(' ');

    const detected = new Set();

    KNOWN_KEYWORDS.forEach(keyword => {
        // Escape special regex characters (like C++, C#, .js)
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Word boundary matching
        const regex = new RegExp(`(^|[^a-zA-Z0-9#+.])${escaped}([^a-zA-Z0-9#+.]|$)`, 'i');
        if (regex.test(combinedText)) {
            detected.add(keyword);
        }
    });

    // Also include any explicitly listed requirements
    if (Array.isArray(requirements)) {
        requirements.forEach(req => {
            if (req && typeof req === 'string' && req.trim().length > 1 && req.trim().length <= 30) {
                detected.add(req.trim());
            }
        });
    }

    return Array.from(detected);
}

/**
 * Match a Job against an Alumnus's preferences and profile skills
 * @param {Object} job
 * @param {Object} userPreferences - { keywords, targetTitles, targetLocations, skills, branch, department, domain }
 * @returns {Object} { matchScore, isMatch, matchingKeywords, matchReasons }
 */
function calculateJobMatch(job, userPreferences = {}) {
    const {
        keywords = [],
        targetTitles = [],
        targetLocations = [],
        skills = [],
        branch = '',
        department = '',
        domain = ''
    } = userPreferences;

    // Combine all user preferred terms (case-insensitive deduplicated)
    const userPreferredTerms = new Set();
    
    [...keywords, ...targetTitles, ...skills].forEach(term => {
        if (term && typeof term === 'string' && term.trim()) {
            userPreferredTerms.add(term.trim().toLowerCase());
        }
    });

    if (domain && typeof domain === 'string' && domain.trim()) {
        userPreferredTerms.add(domain.trim().toLowerCase());
    }

    const jobText = [
        job.title || '',
        job.description || '',
        Array.isArray(job.requirements) ? job.requirements.join(' ') : '',
        Array.isArray(job.keywords) ? job.keywords.join(' ') : '',
        job.company || '',
        job.location || ''
    ].join(' ').toLowerCase();

    const matchingKeywords = [];
    let matchScore = 50; // base score

    // Check each user preferred keyword against job
    userPreferredTerms.forEach(term => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(^|[^a-zA-Z0-9#+.])${escaped}([^a-zA-Z0-9#+.]|$)`, 'i');
        
        if (regex.test(jobText)) {
            // Capitalize properly for display
            const displayTerm = term.charAt(0).toUpperCase() + term.slice(1);
            matchingKeywords.push(displayTerm);
        }
    });

    // Scoring weights
    if (matchingKeywords.length > 0) {
        matchScore += Math.min(matchingKeywords.length * 15, 45); // up to +45
    }

    // Title match boost
    if (targetTitles && targetTitles.length > 0) {
        const titleMatch = targetTitles.some(t => {
            const escaped = t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp(escaped, 'i').test(job.title || '');
        });
        if (titleMatch) matchScore += 15;
    }

    // Location match boost
    if (targetLocations && targetLocations.length > 0) {
        const locMatch = targetLocations.some(l => {
            const escaped = l.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp(escaped, 'i').test(job.location || '') || (l.toLowerCase() === 'remote' && job.workplaceType === 'Remote');
        });
        if (locMatch) matchScore += 10;
    }

    // Cap score at 99%
    matchScore = Math.min(matchScore, 99);

    const matchReasons = [];
    if (matchingKeywords.length > 0) {
        matchReasons.push(`Matches your preference: ${matchingKeywords.slice(0, 3).join(', ')}`);
    }
    if (job.workplaceType === 'Remote') {
        matchReasons.push('Remote opportunity');
    }
    if (matchReasons.length === 0) {
        matchReasons.push('Alumni network opportunity');
    }

    return {
        matchScore,
        isMatch: matchingKeywords.length > 0 || matchScore >= 70,
        matchingKeywords,
        matchReasons
    };
}

module.exports = {
    KNOWN_KEYWORDS,
    extractKeywords,
    calculateJobMatch
};
