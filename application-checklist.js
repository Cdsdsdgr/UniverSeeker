(function () {
    const BASE_TASKS = [
        { id: 'cv', label: 'Подготовить и оформить CV / Резюме' },
        { id: 'essay', label: 'Написать и проверить Эссе / Statement of Purpose' },
        { id: 'recommendations', label: 'Запросить 2-3 рекомендательных письма' },
        { id: 'transcript', label: 'Перевести и заверить транскрипт оценок' }
    ];

    const LEGACY_IDS = {
        'language-test': ['ielts', 'language'],
        'video-presentation': ['video']
    };

    function build(university, previous = []) {
        const oldTasks = Array.isArray(previous) ? previous : [];
        const tasks = BASE_TASKS.map(task => ({ ...task }));
        const testRequirements = typeof university?.reqTests === 'string' ? university.reqTests : '';
        const videoRequirement = typeof university?.reqVideo === 'string' ? university.reqVideo : '';
        const interviewRequirement = typeof university?.reqInterview === 'string' ? university.reqInterview : '';

        if (/\b(?:IELTS|TOEFL|HSK)\b/i.test(testRequirements)) {
            const languageRequirements = testRequirements
                .split(/\s+\/\s+/)
                .filter(requirement => /\b(?:IELTS|TOEFL|HSK)\b/i.test(requirement))
                .join(' / ');
            tasks.push({
                id: 'language-test',
                label: 'Сдать IELTS/TOEFL/HSK',
                detail: languageRequirements || testRequirements
            });
        }

        const satRequired = typeof university?.satRequired === 'boolean'
            ? university.satRequired
            : /\bSAT\b/i.test(testRequirements) && !/\b(?:optional|опционально|не требуется)\b/i.test(testRequirements);
        if (satRequired) {
            tasks.push({
                id: 'sat',
                label: 'Подготовить SAT',
                detail: testRequirements.match(/\bSAT\b[^/]*/i)?.[0] || 'SAT'
            });
        }

        const otherTests = [...testRequirements.matchAll(/\b(?:ACT|NUET|TSA|MAT|HAT)\b/gi)]
            .map(match => match[0].toUpperCase());
        if (otherTests.length) {
            tasks.push({
                id: 'admission-tests',
                label: 'Подготовить вступительные тесты',
                detail: [...new Set(otherTests)].join(' / ')
            });
        }

        if (videoRequirement && !/не требуется|graded paper/i.test(videoRequirement)) {
            tasks.push({
                id: 'video-presentation',
                label: 'Записать видеопрезентацию',
                detail: videoRequirement
            });
        }

        if (interviewRequirement && !/не требуется|тест/i.test(interviewRequirement)) {
            tasks.push({
                id: 'interview',
                label: 'Подготовиться к интервью',
                detail: interviewRequirement
            });
        }

        return tasks.map(task => {
            const ids = [task.id, ...(LEGACY_IDS[task.id] || [])];
            const previousTask = oldTasks.find(item => item && ids.includes(item.id));
            return { ...task, done: Boolean(previousTask?.done) };
        });
    }

    window.UniMatchChecklist = { build };
})();
