document.addEventListener('DOMContentLoaded', function() {
    // عناصر الصوت
    const correctSound = document.getElementById("correctSound");
    const wrongSound = document.getElementById("wrongSound");
    
    // عناصر الواجهة
    const subjectTabs = document.getElementById('subject-tabs');
    const lessonDropdown = document.getElementById('lesson-dropdown');
    const startBtn = document.getElementById('start-quiz');
    const quizContainer = document.getElementById('quiz-container');
    const quizTitle = document.getElementById('quiz-title');
    const lessonSelector = document.getElementById('lesson-selector');
    
    // بيانات الاختبار
    let currentSubject = 'history';
    let currentLesson = '';
    let quizData = [];
    let currentQuestionIndex = 0;
    let score = 0;
    
    // تعريف دروس كل مادة
    const subjects = {
        history: {
            name: 'التاريخ',
            lessons: {
                'الحرب_العالمية_الثانية': 'الحرب العالمية الثانية',
                'التحولات_الاقتصادية': 'التحولات الاقتصادية'
            }
        },
        geography: {
            name: 'الجغرافيا',
            lessons: {
                'التنمية': 'مفهوم التنمية'
            }
        }
    };
    
    // تغيير المادة عند النقر على التبويب
    document.querySelectorAll('.subject-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.subject-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentSubject = this.dataset.subject;
            updateLessonDropdown();
        });
    });
    
    // تحديث قائمة الدروس بناءً على المادة المختارة
    function updateLessonDropdown() {
        lessonDropdown.innerHTML = '<option value="">-- اختر الدرس --</option>';
        
        const subject = subjects[currentSubject];
        quizTitle.textContent = `اختبار ${subject.name}`;
        
        for (const [value, text] of Object.entries(subject.lessons)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            lessonDropdown.appendChild(option);
        }
    }
    
    // بدء الاختبار
    startBtn.addEventListener('click', function() {
        const selectedLesson = lessonDropdown.value;
        if (!selectedLesson) {
            alert("الرجاء اختيار درس من القائمة");
            return;
        }
        
        currentLesson = selectedLesson;
        loadQuestions(selectedLesson);
    });
    
    // تحميل الأسئلة من ملف JSON
    function loadQuestions(lesson) {
        fetch(`${lesson}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('لم يتم العثور على ملف الأسئلة');
                }
                return response.json();
            })
            .then(data => {
                quizData = data;
                // إخفاء عناصر اختيار المادة والدرس
                subjectTabs.style.display = 'none';
                lessonSelector.style.display = 'none';
                quizContainer.style.display = 'block';
                initQuiz();
            })
            .catch(error => {
                alert(`خطأ في تحميل الأسئلة: ${error.message}`);
                console.error(error);
            });
    }
    
    // تهيئة الاختبار
    function initQuiz() {
        if (quizData.length === 0) return;
        
        document.getElementById('total-questions').textContent = quizData.length;
        updateScoreDisplay();
        loadQuestion();
    }
    
    // تحميل السؤال الحالي
    function loadQuestion() {
        if (currentQuestionIndex >= quizData.length) {
            showResults();
            return;
        }
        
        const question = quizData[currentQuestionIndex];
        const questionContainer = document.getElementById('question-container');
        
        document.getElementById('current-question').textContent = currentQuestionIndex + 1;
        updateProgressBar();
        
        let questionHTML = `<div class="question">${question.question}</div>`;
        
        // نظام الأسئلة النصية
        if (question.type === 'text') {
            questionHTML += `
                <div class="input-container">
                    <input type="text" id="answer-input" placeholder="اكتب إجابتك هنا..." autocomplete="off">
                </div>
                <button class="btn-next" id="check-answer" disabled>تحقق</button>
            `;
        } 
        // نظام الأسئلة الاختيارية
        else if (question.type === 'choices') {
            questionHTML += '<div class="choices">';
            
            // خلط الخيارات عشوائياً
            const shuffledOptions = [...question.choices].sort(() => Math.random() - 0.5);
            
            shuffledOptions.forEach((choice, index) => {
                questionHTML += `
                    <button class="choice-btn" data-choice="${question.choices.indexOf(choice)}">
                        ${choice}
                    </button>
                `;
            });
            
            questionHTML += '</div>';
            questionHTML += `<button class="btn-next" id="check-answer" disabled>تحقق</button>`;
        } 
        // نظام الربط بين العناصر (المعدل)
        else if (question.type === 'matching') {
            questionHTML += '<div class="matching-container">';
            questionHTML += '<div class="matching-pairs">';
            
            // إنشاء عمودين منفصلين
            questionHTML += '<div class="matching-row">';
            
            // العمود الأيمن
            questionHTML += '<div class="matching-column right-column">';
            // خلط العناصر اليمنى عشوائياً
            const shuffledRightItems = [...question.rightItems].sort(() => Math.random() - 0.5);
            shuffledRightItems.forEach(item => {
                questionHTML += `
                    <div class="matching-item right-item" data-id="${item.id}">
                        ${item.text}
                    </div>
                `;
            });
            questionHTML += '</div>';
            
            // العمود الأيسر
            questionHTML += '<div class="matching-column left-column">';
            // خلط العناصر اليسرى عشوائياً
            const shuffledLeftItems = [...question.leftItems].sort(() => Math.random() - 0.5);
            shuffledLeftItems.forEach(item => {
                questionHTML += `
                    <div class="matching-item left-item" data-id="${item.id}">
                        ${item.text}
                    </div>
                `;
            });
            questionHTML += '</div>';
            
            questionHTML += '</div>'; // نهاية matching-row
            questionHTML += '</div>'; // نهاية matching-pairs
            
            // أزرار التحكم
            questionHTML += `
                <div class="matching-controls">
                    <button class="matching-btn" id="clear-matching">مسح التحديد</button>
                </div>
            `;
            
            questionHTML += `<button class="btn-next" id="check-answer">تحقق</button>`;
            questionHTML += '</div>'; // نهاية matching-container
        }
        
        // إضافة زر التلميح إذا كان موجوداً
        if (question.hint) {
            questionHTML += `
                <button class="hint-button" id="hint-btn">
                    <span>عرض تلميح</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </button>
            `;
        }
        
        questionContainer.innerHTML = questionHTML;
        
        // إضافة مستمعي الأحداث حسب نوع السؤال
        if (question.type === 'text') {
            const input = document.getElementById('answer-input');
            const checkBtn = document.getElementById('check-answer');
            
            input.addEventListener('input', () => {
                checkBtn.disabled = !input.value.trim();
            });
            
            checkBtn.addEventListener('click', checkAnswer);
        } 
        else if (question.type === 'choices') {
            document.querySelectorAll('.choice-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    // إزالة التحديد من الزر المحدد مسبقاً إن وجد
                    const previouslySelected = document.querySelector('.choice-btn.selected');
                    if (previouslySelected && previouslySelected !== this) {
                        previouslySelected.classList.remove('selected');
                    }
                    
                    // تبديل حالة التحديد للزر الحالي
                    this.classList.toggle('selected');
                    
                    // تمكين/تعطيل زر التحقق بناءً على وجود اختيار
                    document.getElementById('check-answer').disabled = 
                        !document.querySelector('.choice-btn.selected');
                });
            });
            
            document.getElementById('check-answer').addEventListener('click', checkAnswer);
        } 
        else if (question.type === 'matching') {
            let selectedItem = null;
            
            document.querySelectorAll('.matching-item').forEach(item => {
                item.addEventListener('click', function() {
                    // إذا لم يكن هناك عنصر محدد، نحدد العنصر الحالي
                    if (!selectedItem) {
                        selectedItem = this;
                        this.classList.add('selected');
                        return;
                    }
                    
                    // إذا كان العنصر المحدد من نفس النوع (يمين/يسار)، نغير التحديد
                    if (selectedItem.classList.contains('right-item') && this.classList.contains('right-item') ||
                        selectedItem.classList.contains('left-item') && this.classList.contains('left-item')) {
                        selectedItem.classList.remove('selected');
                        selectedItem = this;
                        this.classList.add('selected');
                        return;
                    }
                    
                    // إذا كان العنصر المحدد من النوع الآخر، نربط بينهما
                    // إزالة أي اتصالات سابقة لهذين العنصرين
                    document.querySelectorAll('.matching-item').forEach(i => {
                        if (i.dataset.pairedWith === selectedItem.dataset.id || 
                            i.dataset.pairedWith === this.dataset.id) {
                            delete i.dataset.pairedWith;
                            i.classList.remove('connected');
                        }
                    });
                    
                    // إنشاء الاتصال الجديد
                    selectedItem.dataset.pairedWith = this.dataset.id;
                    this.dataset.pairedWith = selectedItem.dataset.id;
                    
                    selectedItem.classList.remove('selected');
                    selectedItem.classList.add('connected');
                    this.classList.add('connected');
                    selectedItem = null;
                });
            });
            
            // زر مسح التحديد
            document.getElementById('clear-matching').addEventListener('click', function() {
                document.querySelectorAll('.matching-item').forEach(item => {
                    item.classList.remove('selected', 'connected');
                    delete item.dataset.pairedWith;
                });
                selectedItem = null;
            });
            
            document.getElementById('check-answer').addEventListener('click', checkAnswer);
        }
        
        // إضافة زر التلميح إذا كان موجوداً
        if (question.hint) {
            const hintBtn = document.getElementById('hint-btn');
            const hintContainer = document.getElementById('hint-container');
            const hintContent = document.getElementById('hint-content');
            const closeHintBtn = document.getElementById('close-hint-btn');
            
            hintBtn.addEventListener('click', () => {
                hintContent.innerHTML = question.hint;
                hintContainer.classList.add('show');
            });
            
            closeHintBtn.addEventListener('click', () => {
                hintContainer.classList.remove('show');
            });
        }
    }
    
    // ==============================================
    // دوال الذكاء الاصطناعي المضافة
    // ==============================================
    
    /**
     * تطبيع النص العربي لمقارنة أكثر دقة
     * @param {string} text - النص المدخل
     * @returns {string} النص المطبيع
     */
    function normalizeForAI(text) {
        return text
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // إزالة علامات الترقيم
            .replace(/\s{2,}/g, ' ') // تحويل المسافات المتعددة إلى مسافة واحدة
            .trim()
            .toLowerCase()
            .replace(/[أآإ]/g, 'ا') // توحيد أشكال الألف
            .replace(/[ة]/g, 'ه') // تحويل التاء المربوطة إلى هاء
            .replace(/[ى]/g, 'ي') // تحويل الألف المقصورة إلى ياء
            .replace(/[ؤ]/g, 'ء') // توحيد الهمزات
            .replace(/[ئ]/g, 'ء'); // توحيد الهمزات
    }
    
    /**
     * حساب درجة التشابه بين نصين (0 إلى 1)
     * @param {string} str1 - النص الأول
     * @param {string} str2 - النص الثاني
     * @returns {number} درجة التشابه بين 0 و 1
     */
    function calculateSimilarity(str1, str2) {
        const len = Math.max(str1.length, str2.length);
        if (len === 0) return 1.0;
        
        const distance = levenshteinDistance(str1, str2);
        return (len - distance) / len;
    }
    
    /**
     * حساب مسافة ليفنشتاين بين نصين (عدد التعديلات المطلوبة)
     * @param {string} a - النص الأول
     * @param {string} b - النص الثاني
     * @returns {number} مسافة ليفنشتاين
     */
    function levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                const cost = a[j - 1] === b[i - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        
        return matrix[b.length][a.length];
    }
    
    /**
     * فهم الإجابة المدخلة ومقارنتها بالإجابات الصحيحة
     * @param {string} userAnswer - إجابة المستخدم
     * @param {Array} correctAnswers - قائمة الإجابات الصحيحة
     * @returns {Object} نتيجة التحليل
     */
    function understandAnswer(userAnswer, correctAnswers) {
        // معالجة الإجابة لزيادة فرص المطابقة
        const processedUser = normalizeForAI(userAnswer);
        let bestMatch = '';
        let bestScore = 0;
        
        correctAnswers.forEach(correct => {
            const processedCorrect = normalizeForAI(correct);
            const similarity = calculateSimilarity(processedUser, processedCorrect);
            
            if (similarity > bestScore) {
                bestScore = similarity;
                bestMatch = correct;
            }
        });
        
        return {
            match: bestMatch,
            score: bestScore,
            isCorrect: bestScore > 0.7 // يمكن تعديل هذا الحد حسب الحاجة
        };
    }
    
    // ==============================================
    // نهاية دوال الذكاء الاصطناعي
    // ==============================================
    
    // التحقق من الإجابة
    function checkAnswer() {
        const question = quizData[currentQuestionIndex];
        let isCorrect = false;
        let aiFeedback = '';
        
        // نظام الأسئلة النصية مع الذكاء الاصطناعي
        if (question.type === 'text') {
            const input = document.getElementById('answer-input');
            const userAnswer = input.value.trim();
            
            let correctAnswers = [question.answer];
            if (question.alternativeAnswers) {
                correctAnswers = correctAnswers.concat(question.alternativeAnswers);
            }
            
            // عرض رسالة معالجة الذكاء الاصطناعي
            const feedbackElement = document.createElement('div');
            feedbackElement.className = 'ai-processing';
            feedbackElement.textContent = 'جاري تحليل الإجابة...';
            input.parentNode.insertBefore(feedbackElement, input.nextSibling);
            
            // محاكاة معالجة الذكاء الاصطناعي (في تطبيق حقيقي يمكنك استخدام API)
            setTimeout(() => {
                feedbackElement.remove();
                
                const aiResult = understandAnswer(userAnswer, correctAnswers);
                
                if (aiResult.isCorrect) {
                    isCorrect = true;
                    aiFeedback = `تم فهم إجابتك كـ "${aiResult.match}"`;
                } else {
                    aiFeedback = `إجابتك تشبه "${aiResult.match}" ولكنها غير صحيحة`;
                }
                
                // عرض ملاحظات الذكاء الاصطناعي
                const aiFeedbackElement = document.createElement('div');
                aiFeedbackElement.className = 'ai-feedback';
                aiFeedbackElement.textContent = aiFeedback;
                input.parentNode.insertBefore(aiFeedbackElement, input.nextSibling);
                
                // متابعة عملية التصحيح
                completeChecking(isCorrect, question);
            }, 1500);
            
            return;
        } 
        // نظام الأسئلة الاختيارية
        else if (question.type === 'choices') {
            const selectedBtn = document.querySelector('.choice-btn.selected');
            if (!selectedBtn) return;
            
            const selectedIndex = parseInt(selectedBtn.getAttribute('data-choice'));
            
            // دعم عدة إجابات صحيحة
            if (Array.isArray(question.correctIndex)) {
                isCorrect = question.correctIndex.includes(selectedIndex);
                
                // تلوين الإجابات الصحيحة
                question.correctIndex.forEach(idx => {
                    document.querySelectorAll('.choice-btn').forEach(btn => {
                        if (parseInt(btn.getAttribute('data-choice')) === idx) {
                            btn.classList.add('correct');
                        }
                    });
                });
            } 
            // دعم إجابة صحيحة واحدة
            else if (question.correctIndex !== undefined) {
                isCorrect = selectedIndex === question.correctIndex;
                document.querySelector(`.choice-btn[data-choice="${question.correctIndex}"]`).classList.add('correct');
            }
            
            // تلوين الإجابة الخاطئة إذا كانت خاطئة
            if (!isCorrect) {
                selectedBtn.classList.add('incorrect');
            }
        } 
        // نظام الربط بين العناصر
        else if (question.type === 'matching') {
            const connectedPairs = {};
            let correctPairs = 0;
            
            // جمع الأزواج المتصلة
            document.querySelectorAll('.matching-item.connected').forEach(item => {
                if (item.classList.contains('right-item')) {
                    connectedPairs[item.dataset.id] = item.dataset.pairedWith;
                }
            });
            
            // التحقق من الأزواج الصحيحة
            Object.keys(question.correctPairs).forEach(rightId => {
                if (connectedPairs[rightId] === question.correctPairs[rightId]) {
                    correctPairs++;
                }
            });
            
            // إذا كانت جميع الأزواج صحيحة
            isCorrect = correctPairs === Object.keys(question.correctPairs).length;
            
            // تلوين الأزواج الصحيحة والخاطئة
            document.querySelectorAll('.matching-item.connected').forEach(item => {
                if (item.classList.contains('right-item')) {
                    const leftId = item.dataset.pairedWith;
                    const leftItem = document.querySelector(`.left-item[data-id="${leftId}"]`);
                    
                    if (question.correctPairs[item.dataset.id] === leftId) {
                        item.classList.add('correct');
                        leftItem.classList.add('correct');
                    } else {
                        item.classList.add('incorrect');
                        leftItem.classList.add('incorrect');
                    }
                }
            });
        }
        
        // تعطيل جميع العناصر بعد الإجابة
        if (question.type === 'choices') {
            document.querySelectorAll('.choice-btn').forEach(btn => {
                btn.style.pointerEvents = 'none';
            });
        } else if (question.type === 'matching') {
            document.querySelectorAll('.matching-item').forEach(item => {
                item.style.pointerEvents = 'none';
            });
            document.getElementById('clear-matching').disabled = true;
        }
        
        const checkBtn = document.getElementById('check-answer');
        if (checkBtn) checkBtn.disabled = true;
        
        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn) hintBtn.style.display = 'none';
        
        completeChecking(isCorrect, question);
    }
    
    function completeChecking(isCorrect, question) {
        if (isCorrect) {
            correctSound.play();
            score++;
            updateScoreDisplay();
        } else {
            wrongSound.play();
        }
        
        // عرض التغذية الراجعة
        setTimeout(() => {
            showFeedback(
                isCorrect, 
                getCorrectAnswerText(question)
            );
        }, 800);
    }
    
    // الحصول على نص الإجابة الصحيحة
    function getCorrectAnswerText(question) {
        if (question.type === 'text') {
            return question.answer;
        } else if (question.type === 'choices') {
            if (Array.isArray(question.correctIndex)) {
                return question.correctIndex.map(idx => question.choices[idx]).join(' أو ');
            } else {
                return question.choices[question.correctIndex];
            }
        } else if (question.type === 'matching') {
            let correctMatches = [];
            Object.keys(question.correctPairs).forEach(rightId => {
                const rightItem = question.rightItems.find(item => item.id === rightId);
                const leftItem = question.leftItems.find(item => item.id === question.correctPairs[rightId]);
                correctMatches.push(`${rightItem.text} ← ${leftItem.text}`);
            });
            return correctMatches.join('<br>');
        }
        return '';
    }
    
    // تطبيع الإجابة النصية
    function normalizeAnswer(answer) {
        return answer
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim()
            .toLowerCase();
    }
    
    // عرض نتيجة الإجابة
    function showFeedback(isCorrect, correctAnswer = null) {
        const feedbackPopup = document.getElementById('feedback-popup');
        const feedbackMessage = document.getElementById('feedback-message');
        const correctAnswerElement = document.getElementById('correct-answer');
        const continueBtn = document.getElementById('continue-btn');
        
        feedbackPopup.className = `feedback-popup ${isCorrect ? 'correct' : 'incorrect'}`;
        feedbackMessage.textContent = isCorrect ? 'إجابة صحيحة!' : 'إجابة خاطئة';
        
        if (!isCorrect && correctAnswer) {
            correctAnswerElement.innerHTML = `الإجابة الصحيحة: ${correctAnswer}`;
        } else {
            correctAnswerElement.textContent = '';
        }
        
        feedbackPopup.classList.add('show');
        
        continueBtn.onclick = () => {
            feedbackPopup.classList.remove('show');
            currentQuestionIndex++;
            loadQuestion();
        };
    }
    
    // تحديث شريط التقدم
    function updateProgressBar() {
        const progress = (currentQuestionIndex / quizData.length) * 100;
        document.querySelector('.progress-fill').style.width = `${progress}%`;
    }
    
    // تحديث عرض النتيجة
    function updateScoreDisplay() {
        const percentage = Math.round((score / quizData.length) * 100);
        document.getElementById('score-display').textContent = `${percentage}%`;
    }
    
    // عرض النتائج النهائية
    function showResults() {
        const questionContainer = document.getElementById('question-container');
        const percentage = Math.round((score / quizData.length) * 100);
        
        let resultMessage;
        if (percentage >= 90) {
            resultMessage = "ممتاز! لديك فهم ممتاز لهذا الموضوع.";
        } else if (percentage >= 70) {
            resultMessage = "جيد جداً! لديك معرفة قوية بالموضوع.";
        } else if (percentage >= 50) {
            resultMessage = "ليس سيئاً! واصل التدرب لتحسين أدائك.";
        } else {
            resultMessage = "واصل التعلم والتدرب، ستحقق تقدمًا قريباً!";
        }
        
        questionContainer.innerHTML = `
            <div class="result-container">
                <h2>انتهى الاختبار!</h2>
                <div class="score">${score}/${quizData.length}</div>
                <div class="score-details">
                    <p>${resultMessage}</p>
                    <p>النسبة المئوية: ${percentage}%</p>
                </div>
                <button class="btn-restart" id="restart-quiz">إعادة الاختبار</button>
            </div>
        `;
        
        document.getElementById('restart-quiz').addEventListener('click', function() {
            subjectTabs.style.display = 'flex';
            lessonSelector.style.display = 'block';
            quizContainer.style.display = 'none';
            
            currentQuestionIndex = 0;
            score = 0;
            document.querySelector('.progress-fill').style.width = '0%';
            document.getElementById('score-display').textContent = '0%';
            
            updateLessonDropdown();
        });
    }
    
    // تهيئة الواجهة عند التحميل
    updateLessonDropdown();
});
