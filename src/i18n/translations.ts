export type UILanguage = 'en' | 'ja';

export const translations = {
  en: {
    // App header
    'app.title': 'Number Practice',
    'app.subtitle': 'Japanese ↔ English number interpretation',

    // Footer
    'footer.browserRecommendation': 'Chrome, Edge, or Safari recommended',

    // Mode selection
    'mode.chooseTitle': 'Choose Your Path',
    'mode.chooseSubtitle': 'Select a direction to start practicing',
    'mode.jaToEn.title': 'Japanese → English',
    'mode.jaToEn.description': 'Listen in Japanese, respond in English',
    'mode.jaToEn.short': 'JP → EN',
    'mode.enToJa.title': 'English → Japanese',
    'mode.enToJa.description': 'Listen in English, respond in Japanese',
    'mode.enToJa.short': 'EN → JP',

    // Level selection
    'level.selectTitle': 'Select Difficulty Level',
    'level.modeIndicator': 'Mode: {mode}',
    'level.back': '← Back',
    'level.attempts': '{count} attempts',
    'level.accuracy': '{percent}% accuracy',
    'level.streakToward': '{current}/{required} streak toward {nextLevel}',
    'level.unlockHint': 'Get {count} correct in a row on {levelName}',
    'level.totalStats': 'Total: {attempts} attempts | {correct} correct | Best streak: {bestStreak}',

    // Nav
    'nav.mode': 'Mode',
    'nav.level': 'Level',
    'nav.locked': 'locked',

    // Practice area
    'practice.ready': 'Ready',
    'practice.listen': 'Listen...',
    'practice.yourTurn': 'Your turn!',
    'practice.checking': 'Checking...',
    'practice.go': 'Go!',
    'practice.stopRecording': 'Stop Recording',
    'practice.retry': 'Retry',
    'practice.hearAgain': 'Hear Again',
    'practice.stats': 'Stats',
    'practice.hideStats': 'Hide Stats',
    'practice.youSaid': 'You said:',
    'practice.correct': '{correct}/{total} correct ({accuracy}%)',
    'practice.streak': '{count} streak',
    'practice.unlockDone': '{levelName} unlocked!',
    'practice.unlockPending': '{current}/{required} to unlock {levelName}',
    'practice.finalLevel': 'Final level',

    // Feedback area
    'feedback.correct': 'Correct!',
    'feedback.incorrect': 'Incorrect',
    'feedback.theNumberWas': 'The number was:',
    'feedback.youSaid': 'You said:',
    'feedback.correctAnswer': 'Correct answer:',
    'feedback.next': 'Next',
    'feedback.replay': 'Replay',
    'feedback.notRecognized': '"{answer}" (not recognized as a number)',
    'feedback.veryClose': 'Very close! Off by {diff}.',
    'feedback.checkPlace': 'Check the {place} place.',
    'feedback.fewerDigits': 'Your number has {userDigits} digits, but the answer has {correctDigits} digits.',
    'feedback.moreDigits': 'Your number has too many digits ({userDigits} instead of {correctDigits}).',
    'feedback.tryAgain': 'Try again!',
    'feedback.trySayingComplete': 'Try saying the complete number.',
    'feedback.levelUnlocked': 'Level Unlocked: {levelName}!',
    'feedback.tryNewLevel': 'Try {levelName}!',
    'feedback.stayOn': 'Stay on {levelName}',
    'feedback.streakProgress': '{current}/{required} to unlock {levelName}',
    'feedback.streakReset': 'Streak reset — 0/{required} to unlock {levelName}',
    'feedback.streakLost': 'Lost {lost} streak — 0/{required} to unlock {levelName}',
    'feedback.noSpeechDetected': 'No speech detected — try again',

    // Heatmap
    'heatmap.title': 'Practice History',
    'heatmap.noAttempts': 'No attempts yet',
    'heatmap.correct': 'Correct',
    'heatmap.incorrect': 'Incorrect',
    'heatmap.bestStreak': 'Best streak',
    'heatmap.attempts': 'Attempts',
    'heatmap.accuracy': 'Accuracy',
    'heatmap.activeDays': 'Active days',
    'heatmap.today': 'Today',
    'heatmap.yesterday': 'Yesterday',
    'heatmap.daysAgo': '{count}d ago',

    // Error
    'error.somethingWrong': 'Something went wrong',
    'error.errorIn': 'Error in:',
    'error.technicalDetails': 'Technical Details',
    'error.tryAgain': 'Try Again',
    'error.reloadPage': 'Reload Page',
    'error.dismiss': 'Dismiss',
    'error.speechNotSupported': 'Your browser does not support Speech Recognition. Please use Chrome, Edge, or Safari.',

    // Onboarding
    'onboarding.instruction': 'Practice interpreting numbers between Japanese and English. Choose a direction, then work through difficulty levels by getting 10 correct in a row.',
    'onboarding.gotIt': 'Got it!',

    // Digit place names
    'place.ones': 'ones',
    'place.tens': 'tens',
    'place.hundreds': 'hundreds',
    'place.thousands': 'thousands',
    'place.digit': 'digit {position}',
  },

  ja: {
    // App header
    'app.title': '数字トレーニング',
    'app.subtitle': '日本語 ↔ 英語 数字通訳練習',

    // Footer
    'footer.browserRecommendation': 'Chrome、Edge、Safariを推奨',

    // Mode selection
    'mode.chooseTitle': 'モードを選択',
    'mode.chooseSubtitle': '練習の方向を選んでください',
    'mode.jaToEn.title': '日本語 → 英語',
    'mode.jaToEn.description': '日本語で聞いて英語で答える',
    'mode.jaToEn.short': 'JP → EN',
    'mode.enToJa.title': '英語 → 日本語',
    'mode.enToJa.description': '英語で聞いて日本語で答える',
    'mode.enToJa.short': 'EN → JP',

    // Level selection
    'level.selectTitle': '難易度を選択',
    'level.modeIndicator': 'モード: {mode}',
    'level.back': '← 戻る',
    'level.attempts': '{count}回',
    'level.accuracy': '正答率{percent}%',
    'level.streakToward': '{current}/{required} 連続正解 → {nextLevel}',
    'level.unlockHint': '{levelName}で{count}回連続正解が必要',
    'level.totalStats': '合計: {attempts}回 | 正解{correct}回 | 最高連続: {bestStreak}',

    // Nav
    'nav.mode': 'モード',
    'nav.level': 'レベル',
    'nav.locked': 'ロック中',

    // Practice area
    'practice.ready': '準備完了',
    'practice.listen': '聞いてください...',
    'practice.yourTurn': 'あなたの番！',
    'practice.checking': '確認中...',
    'practice.go': 'スタート！',
    'practice.stopRecording': '録音停止',
    'practice.retry': 'やり直す',
    'practice.hearAgain': 'もう一度聞く',
    'practice.stats': '統計',
    'practice.hideStats': '統計を隠す',
    'practice.youSaid': 'あなたの回答:',
    'practice.correct': '{correct}/{total} 正解 ({accuracy}%)',
    'practice.streak': '{count} 連続',
    'practice.unlockDone': '{levelName} 解放済み！',
    'practice.unlockPending': '{current}/{required} → {levelName}解放',
    'practice.finalLevel': '最終レベル',

    // Feedback area
    'feedback.correct': '正解！',
    'feedback.incorrect': '不正解',
    'feedback.theNumberWas': '出題された数字:',
    'feedback.youSaid': 'あなたの回答:',
    'feedback.correctAnswer': '正解:',
    'feedback.next': '次へ',
    'feedback.replay': 'もう一度聞く',
    'feedback.notRecognized': '「{answer}」（数字として認識できませんでした）',
    'feedback.veryClose': '惜しい！{diff}の差です。',
    'feedback.checkPlace': '{place}の桁を確認してください。',
    'feedback.fewerDigits': 'あなたの数字は{userDigits}桁ですが、正解は{correctDigits}桁です。',
    'feedback.moreDigits': '桁数が多すぎます（{correctDigits}桁ではなく{userDigits}桁）。',
    'feedback.tryAgain': 'もう一度！',
    'feedback.trySayingComplete': '数字全体を言ってみてください。',
    'feedback.levelUnlocked': 'レベル解放: {levelName}!',
    'feedback.tryNewLevel': '{levelName}に挑戦！',
    'feedback.stayOn': '{levelName}を続ける',
    'feedback.streakProgress': '{current}/{required} → {levelName}解放',
    'feedback.streakReset': '連続正解リセット — 0/{required} → {levelName}解放',
    'feedback.streakLost': '{lost}連続を失いました — 0/{required} → {levelName}解放',
    'feedback.noSpeechDetected': '音声が検出されませんでした — もう一度お試しください',

    // Heatmap
    'heatmap.title': '練習履歴',
    'heatmap.noAttempts': 'まだ記録がありません',
    'heatmap.correct': '正解',
    'heatmap.incorrect': '不正解',
    'heatmap.bestStreak': '最高連続',
    'heatmap.attempts': '回数',
    'heatmap.accuracy': '正答率',
    'heatmap.activeDays': '練習日数',
    'heatmap.today': '今日',
    'heatmap.yesterday': '昨日',
    'heatmap.daysAgo': '{count}日前',

    // Error
    'error.somethingWrong': '問題が発生しました',
    'error.errorIn': 'エラー発生箇所:',
    'error.technicalDetails': '技術的な詳細',
    'error.tryAgain': '再試行',
    'error.reloadPage': 'ページを再読み込み',
    'error.dismiss': '閉じる',
    'error.speechNotSupported': 'お使いのブラウザは音声認識に対応していません。Chrome、Edge、Safariをお使いください。',

    // Onboarding
    'onboarding.instruction': '日本語と英語の間で数字を通訳する練習です。方向を選び、10回連続正解で次のレベルに進みましょう。',
    'onboarding.gotIt': '了解！',

    // Digit place names
    'place.ones': '一の位',
    'place.tens': '十の位',
    'place.hundreds': '百の位',
    'place.thousands': '千の位',
    'place.digit': '第{position}桁',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
