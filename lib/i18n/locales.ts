export const locales = {
  en: {
    // Top bar and general layout
    "logo.life": "life",
    "nav.boards": "← boards",
    "nav.home": "← home",
    "nav.rules": "rules",
    "nav.help": "help",
    "home.boards": "// boards",
    "theme.toggle": "Toggle theme",
    "search.placeholder": "search posts…",
    "search.no_results": "No results.",
    "search.aria": "Search",
    
    // AuthMenu
    "auth.handle": "handle",
    "auth.password": "password",
    "auth.claim_or_login": "claim or log in",
    "auth.new_handle_tip": "new handle? claiming it creates your account.",
    "auth.cancel": "cancel",
    "auth.go": "go",
    "auth.admin": "admin",
    "auth.out": "out",
    "auth.logged_in": "Logged in.",
    "auth.logged_out": "Logged out.",
    "auth.failed": "Failed.",
    
    // Rules / RulesGate
    "rules.title": "rules",
    "rules.before_enter": "before you enter",
    "rules.liability_waiver": "liability waiver",
    "rules.agreement": "I am at least 13, I agree to the rules, and I accept the liability waiver above — I will not hold the author(s) or operator(s) liable for anything on this site.",
    "rules.understand_agree": "I understand and agree",
    "rules.read_full": "read full rules",
    "rules.re_accept": "Re-read & re-accept",
    "rules.re_accept_tip": "Clears your acceptance and shows the agreement dialog again.",

    // Boards & Threads Listing
    "board.threads_count": "{count} {count, plural, =1 {thread} other {threads}}",
    "board.replies_count": "{count} {count, plural, =1 {reply} other {replies}}",
    "board.readonly": "This board is read-only. Only admins can post.",
    "board.no_threads": "No threads yet. Start the fire.",
    "board.lock": "locked",
    "board.pin": "pinned",
    "catalog.loading": "loading…",
    "catalog.load_more": "load more",
    "card.no_text": "(no text)",
    "board.gen.name": "General",
    "board.gen.description": "Anything goes (mostly).",
    "board.rant.name": "Rants",
    "board.rant.description": "Get it off your chest.",
    "board.hw.name": "Homework",
    "board.hw.description": "Classes, assignments, suffering.",
    "board.ann.name": "Announcements",
    "board.ann.description": "Official posts only.",
    "board.random.name": "Random",
    "board.random.description": "Chaos.",
    
    // Composer (Thread / Reply)
    "composer.new_thread": "+ New thread",
    "composer.subject_placeholder": "Subject (optional)",
    "composer.anonymous_placeholder": "Anonymous (name#tripcode optional)",
    "composer.body_placeholder_thread": "What's on your mind?",
    "composer.body_placeholder_reply": "Reply… (>greentext, >>postid, [s]spoiler[/s])",
    "composer.image": "image",
    "composer.cancel": "Cancel",
    "composer.post_thread": "Post thread",
    "composer.posting": "Posting…",
    "composer.reply": "Reply",
    "composer.thread_failed": "Failed to create thread.",
    "composer.reply_failed": "Post failed. Try again.",
    "composer.thread_locked": "This thread is locked.",
    "composer.sage": "sage",
    
    // Post actions / state
    "post.anonymous": "Anonymous",
    "post.deleted": "[deleted]",
    "post.posting": "posting…",
    "post.ban": "ban",
    "post.report": "Report post",
    "post.delete_title": "Delete (within 180 min of posting)",
    
    // Dialogs / alerts
    "alert.delete_confirm": "Delete this post?",
    "alert.delete_failed": "Couldn't delete the post.",
    "alert.ban_confirm": "Ban this poster? This is permanent unless lifted.",
    "alert.ban_reason": "Ban reason (optional):",
    "alert.ban_failed": "Ban failed.",
    "alert.ban_success": "Poster banned.",
    "alert.reported": "Reported.",
    "alert.report_failed": "Report failed.",
    "report.title": "report post #{postId}",
    "report.reason_placeholder": "Reason (optional)",
    "report.cancel": "cancel",
    "report.submit": "report",
    
    // Admin login
    "admin.login.title": "xhw life — admin",
    "admin.login.placeholder.handle": "handle",
    "admin.login.placeholder.password": "password",
    "admin.login.button": "login",
    "admin.login.failed": "Login failed.",

    // Help page
    "help.title": "help",
    "help.intro": "XHW Life is an anonymous school forum. No account required to post.",
    "help.section.posting": "Posting",
    "help.posting.anonymous": "Leave the name field blank to post as Anonymous.",
    "help.posting.handle": "Type a name to use a display name. Add #secret to generate a tripcode (e.g. Name#password → Name !XXXXXXXXXX).",
    "help.posting.sage": "Check 'sage' to reply without bumping the thread to the top.",
    "help.posting.image": "Attach one image per post (JPEG, PNG, GIF, WebP). Max 8 MB. EXIF data is stripped automatically.",
    "help.posting.self_delete": "You can delete your own post within 180 minutes of posting.",
    "help.section.formatting": "Formatting",
    "help.fmt.greentext": "> at the start of a line → green text",
    "help.fmt.quote": ">>123abc at the start of a line → links to post #123abc",
    "help.fmt.spoiler": "[s]text[/s] → spoiler (hover to reveal)",
    "help.fmt.url": "Bare URLs are linked automatically.",
    "help.section.identity": "Identity & tripcodes",
    "help.identity.token": "A poster token cookie is set on your first post. It identifies you for self-delete and rate limiting — it is never shown to other users.",
    "help.identity.tripcode": "Tripcodes let you prove you're the same person across threads without revealing your password. The server hashes Name#secret; only the hash is shown.",
    "help.identity.handle": "Register a handle via the top-right menu. Handles are site-wide usernames protected by a password.",
    "help.section.rules": "Rules & moderation",
    "help.rules.link": "Read the full rules →",
    "help.rules.report": "Use the flag icon on any post to report it. Reports go to the admin queue.",
    "help.rules.ban": "IP bans are applied by hash — raw IPs are never stored.",
    "help.section.search": "Search",
    "help.search.desc": "The search icon in the top bar searches post bodies using full-text search. Results link directly to the post in its thread.",
    "help.section.misc": "Miscellaneous",
    "help.misc.theme": "Click the sun/moon icon to toggle dark/light mode.",
    "help.misc.lang": "Click the language tag (EN / ZH / LZH) to cycle between English, Simplified Chinese, and Classical Chinese.",
    "help.misc.catalog": "The board catalog shows the most recent 30 threads. Tap 'load more' for older threads.",
  },
  zh: {
    // Top bar and general layout
    "logo.life": "生活",
    "nav.boards": "← 版块列表",
    "nav.home": "← 首页",
    "nav.rules": "规则",
    "nav.help": "帮助",
    "home.boards": "// 版块",
    "theme.toggle": "切换主题",
    "search.placeholder": "搜索帖子…",
    "search.no_results": "无结果。",
    "search.aria": "搜索",
    
    // AuthMenu
    "auth.handle": "用户名/登录",
    "auth.password": "密码",
    "auth.claim_or_login": "认领用户名或登录",
    "auth.new_handle_tip": "新用户名？首次认领即创建您的账号。",
    "auth.cancel": "取消",
    "auth.go": "开始",
    "auth.admin": "管理",
    "auth.out": "注销",
    "auth.logged_in": "已登录。",
    "auth.logged_out": "已注销。",
    "auth.failed": "登录失败。",
    
    // Rules / RulesGate
    "rules.title": "规则",
    "rules.before_enter": "进入前须知",
    "rules.liability_waiver": "免责声明",
    "rules.agreement": "我已满13岁，同意上述规则，并接受上述免责声明——我不会因本网站的任何内容追究作者或运营者的责任。",
    "rules.understand_agree": "我理解并同意",
    "rules.read_full": "阅读完整规则",
    "rules.re_accept": "重新阅读并确认",
    "rules.re_accept_tip": "清除您的接受记录，并重新显示协议弹窗。",

    // Boards & Threads Listing
    "board.threads_count": "{count} 个帖子",
    "board.replies_count": "{count} 条回复",
    "board.readonly": "该版块为只读模式。仅管理员可发帖。",
    "board.no_threads": "暂无帖子。开始第一帖吧。",
    "board.lock": "已锁定",
    "board.pin": "已置顶",
    "catalog.loading": "加载中…",
    "catalog.load_more": "加载更多",
    "card.no_text": "(无内容)",
    "board.gen.name": "综合版",
    "board.gen.description": "海纳百川，无所不谈（大多）。",
    "board.rant.name": "宣泄板",
    "board.rant.description": "一吐为快，宣泄心声。",
    "board.hw.name": "学业板",
    "board.hw.description": "功功课学业，探讨切磋，以及受难。",
    "board.ann.name": "公告板",
    "board.ann.description": "仅限官方发帖。",
    "board.random.name": "混沌板",
    "board.random.description": "无序与混沌之地。",
    
    // Composer (Thread / Reply)
    "composer.new_thread": "+ 新帖",
    "composer.subject_placeholder": "主题 (可选)",
    "composer.anonymous_placeholder": "匿名用户 (可选 姓名#暗号)",
    "composer.body_placeholder_thread": "在想些什么？",
    "composer.body_placeholder_reply": "回复… (>绿色文本, >>帖子ID, [s]剧透[/s])",
    "composer.image": "图片",
    "composer.cancel": "取消",
    "composer.post_thread": "发布新帖",
    "composer.posting": "发布中…",
    "composer.reply": "回复",
    "composer.thread_failed": "创建帖子失败。",
    "composer.reply_failed": "发布失败，请重试。",
    "composer.thread_locked": "此帖已锁定。",
    "composer.sage": "不推文(sage)",
    
    // Post actions / state
    "post.anonymous": "匿名用户",
    "post.deleted": "[已删除]",
    "post.posting": "正在发布…",
    "post.ban": "封禁",
    "post.report": "举报帖子",
    "post.delete_title": "删除 (发帖后 180 分钟内)",
    
    // Dialogs / alerts
    "alert.delete_confirm": "确定删除此帖？",
    "alert.delete_failed": "无法删除该帖子。",
    "alert.ban_confirm": "确定要封禁此发布者吗？除非解除，否则为永久封禁。",
    "alert.ban_reason": "封禁原因 (可选):",
    "alert.ban_failed": "封禁失败。",
    "alert.ban_success": "发布者已被封禁。",
    "alert.reported": "举报成功。",
    "alert.report_failed": "举报失败。",
    "report.title": "举报帖子 #{postId}",
    "report.reason_placeholder": "原因 (可选)",
    "report.cancel": "取消",
    "report.submit": "举报",
    
    // Admin login
    "admin.login.title": "xhw life — 管理员登录",
    "admin.login.placeholder.handle": "用户名",
    "admin.login.placeholder.password": "密码",
    "admin.login.button": "登录",
    "admin.login.failed": "登录失败。",

    // Help page
    "help.title": "帮助",
    "help.intro": "XHW Life 是一个匿名校园论坛。无需注册即可发帖。",
    "help.section.posting": "发帖",
    "help.posting.anonymous": "名称栏留空即以「匿名用户」身份发帖。",
    "help.posting.handle": "填写名称可使用显示名。在名称后加 #密码 可生成三元码（例：用户名#密码 → 用户名 !XXXXXXXXXX）。",
    "help.posting.sage": "勾选 sage 可回复但不推帖（不将帖子置顶）。",
    "help.posting.image": "每帖可附一张图片（JPEG、PNG、GIF、WebP），最大 8 MB，EXIF 信息自动去除。",
    "help.posting.self_delete": "发帖后 180 分钟内可自行删除。",
    "help.section.formatting": "格式",
    "help.fmt.greentext": "行首以 > 开头 → 绿色文字",
    "help.fmt.quote": "行首输入 >>帖子ID → 引用对应帖子",
    "help.fmt.spoiler": "[s]文字[/s] → 剧透遮罩（悬停可显示）",
    "help.fmt.url": "纯文本 URL 自动转为超链接。",
    "help.section.identity": "身份与三元码",
    "help.identity.token": "首次发帖时，系统会设置一个发帖者令牌 Cookie，用于自删和频率限制，不对其他用户显示。",
    "help.identity.tripcode": "三元码可让您跨帖证明同一身份，且无需透露密码。服务器对「名称#密码」进行哈希，仅显示哈希结果。",
    "help.identity.handle": "通过右上角菜单注册用户名，用户名为全站唯一，受密码保护。",
    "help.section.rules": "规则与管理",
    "help.rules.link": "查看完整规则 →",
    "help.rules.report": "点击帖子上的举报图标进行举报，举报将进入管理员队列。",
    "help.rules.ban": "IP 封禁通过哈希实现，原始 IP 地址不会被存储。",
    "help.section.search": "搜索",
    "help.search.desc": "顶栏搜索图标可对帖子正文进行全文搜索，搜索结果直接链接到帖子所在楼层。",
    "help.section.misc": "其他",
    "help.misc.theme": "点击日/月图标切换深色/浅色模式。",
    "help.misc.lang": "点击语言标签（EN / ZH / LZH）可在英文、简体中文和文言文之间切换。",
    "help.misc.catalog": "版块目录显示最新 30 个帖子，点击「加载更多」可查看更早的帖子。",
  },
  lzh: {
    // Top bar and general layout
    "logo.life": "生息",
    "nav.boards": "← 诸版",
    "nav.home": "← 归闾",
    "nav.rules": "约法",
    "nav.help": "问津",
    "home.boards": "// 诸版",
    "theme.toggle": "易调阴阳",
    "search.placeholder": "寻觅文墨…",
    "search.no_results": "查无此文。",
    "search.aria": "搜寻",
    
    // AuthMenu
    "auth.handle": "名讳",
    "auth.password": "暗言",
    "auth.claim_or_login": "认领名讳或登阁",
    "auth.new_handle_tip": "新名讳乎？初次认领即成书契。",
    "auth.cancel": "作罢",
    "auth.go": "行",
    "auth.admin": "有司",
    "auth.out": "出阁",
    "auth.logged_in": "已登阁。",
    "auth.logged_out": "已出阁。",
    "auth.failed": "未果。",
    
    // Rules / RulesGate
    "rules.title": "约法",
    "rules.before_enter": "凡入此门",
    "rules.liability_waiver": "免责声明",
    "rules.agreement": "吾已及舞勺之年（十三岁以上），谨遵约法，并纳免责之契——不以本站之文罪及作者与有司。",
    "rules.understand_agree": "吾知晓并允之",
    "rules.read_full": "尽览约法",
    "rules.re_accept": "重阅并允之",
    "rules.re_accept_tip": "清除允约记录，重现协议弹窗。",

    // Boards & Threads Listing
    "board.threads_count": "{count} 议",
    "board.replies_count": "{count} 答",
    "board.readonly": "此版唯读。非有司不可着墨。",
    "board.no_threads": "暂无陈述。试鸣第一声。",
    "board.lock": "扃锁",
    "board.pin": "高悬",
    "catalog.loading": "候之…",
    "catalog.load_more": "更展余卷",
    "card.no_text": "(无文墨)",
    "board.gen.name": "综合",
    "board.gen.description": "诸子百家，无所不言（大体）。",
    "board.rant.name": "宣泄",
    "board.rant.description": "一吐块垒，宣泄胸臆。",
    "board.hw.name": "课业",
    "board.hw.description": "庠序学业，探讨切磋，以及磨砺。",
    "board.ann.name": "布告",
    "board.ann.description": "唯布公文。",
    "board.random.name": "混沌",
    "board.random.description": "无序与混沌之地。",
    
    // Composer (Thread / Reply)
    "composer.new_thread": "+ 启新议",
    "composer.subject_placeholder": "题署 (自便)",
    "composer.anonymous_placeholder": "无名氏 (名讳#暗号自便)",
    "composer.body_placeholder_thread": "胸中何意？",
    "composer.body_placeholder_reply": "附议… (>青碧字, >>引文, [s]隐墨[/s])",
    "composer.image": "丹青",
    "composer.cancel": "作罢",
    "composer.post_thread": "启议",
    "composer.posting": "修撰中…",
    "composer.reply": "附议",
    "composer.thread_failed": "启议未果。",
    "composer.reply_failed": "附议未果。再试之。",
    "composer.thread_locked": "此议已扃。",
    "composer.sage": "下沉(sage)",
    
    // Post actions / state
    "post.anonymous": "无名氏",
    "post.deleted": "[已佚]",
    "post.posting": "修撰中…",
    "post.ban": "流放",
    "post.report": "纠弹此文",
    "post.delete_title": "削去 (发帖一时半之内)",
    
    // Dialogs / alerts
    "alert.delete_confirm": "确欲削去此文乎？",
    "alert.delete_failed": "未能削去此文。",
    "alert.ban_confirm": "确欲流放此人乎？非赦免不得归。",
    "alert.ban_reason": "流放事由 (自便):",
    "alert.ban_failed": "流放未果。",
    "alert.ban_success": "已流放之。",
    "alert.reported": "已告发。",
    "alert.report_failed": "告发未果。",
    "report.title": "告发第 #{postId} 文",
    "report.reason_placeholder": "事由 (自便)",
    "report.cancel": "作罢",
    "report.submit": "纠弹",
    
    // Admin login
    "admin.login.title": "xhw life — 有司入署",
    "admin.login.placeholder.handle": "名讳",
    "admin.login.placeholder.password": "印信",
    "admin.login.button": "登堂",
    "admin.login.failed": "登堂未果。",

    // Help page
    "help.title": "问津",
    "help.intro": "此阁匿名，无须注册，即可著文。",
    "help.section.posting": "著文之法",
    "help.posting.anonymous": "名讳栏空置，即以无名氏发文。",
    "help.posting.handle": "填名讳可署显名。名后附 #暗言 可生三元码（如：名讳#暗言 → 名讳 !XXXXXXXXXX）。",
    "help.posting.sage": "勾选 sage，可附议而不推帖（不令其上升）。",
    "help.posting.image": "每文可附一丹青（JPEG、PNG、GIF、WebP），不逾八兆，EXIF 信息自动抹除。",
    "help.posting.self_delete": "发文后一时半之内，可自行削去。",
    "help.section.formatting": "文体格式",
    "help.fmt.greentext": "行首以 > 起笔 → 青碧之字",
    "help.fmt.quote": "行首书 >>文号 → 引指对应之文",
    "help.fmt.spoiler": "[s]文字[/s] → 隐墨（悬鼠可见）",
    "help.fmt.url": "裸露网址自动成链。",
    "help.section.identity": "身份与三元码",
    "help.identity.token": "初次著文，系统立设发文者令牌，以供自删与频控之用，他人不得见。",
    "help.identity.tripcode": "三元码可跨帖证明同一之身，无需泄露暗言。服务器对「名讳#暗言」取哈希，仅示哈希之值。",
    "help.identity.handle": "于右上角菜单认领名讳，名讳为全站唯一，受暗言保护。",
    "help.section.rules": "约法与管制",
    "help.rules.link": "尽览约法 →",
    "help.rules.report": "点文上之纠弹图标即可举告，举告将入有司待办队列。",
    "help.rules.ban": "IP 流放以哈希施之，原始 IP 地址不作留存。",
    "help.section.search": "搜寻",
    "help.search.desc": "顶栏搜寻图标可对帖文正文进行全文检索，结果直链至所在之楼。",
    "help.section.misc": "其余",
    "help.misc.theme": "点日月图标可切换阴阳（深色/浅色）模式。",
    "help.misc.lang": "点语言标签（EN / ZH / LZH）可在英文、简体中文、文言文之间易调。",
    "help.misc.catalog": "版块目录展示最新三十议，点「更展余卷」可见更早之帖。",
  }
};

export type Locale = "en" | "zh" | "lzh";

export function translate(locale: Locale, key: keyof typeof locales.en, variables?: Record<string, string | number>): string {
  const dict = locales[locale] || locales.en;
  let text = (dict as any)[key] || (locales.en as any)[key] || key;
  
  if (variables) {
    Object.entries(variables).forEach(([k, v]) => {
      // Handle simple pluralization inside curly braces: {count, plural, =1 {singular} other {plural}}
      const pluralRegex = new RegExp(`\\{${k},\\s*plural,\\s*=1\\s*\\{([^}]+)\\}\\s*other\\s*\\{([^}]+)\\}\\}`, 'g');
      if (pluralRegex.test(text)) {
        text = text.replace(pluralRegex, Number(v) === 1 ? '$1' : '$2');
      }
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return text;
}

export function translateBoard(
  locale: Locale,
  boardId: string,
  field: "name" | "description",
  fallback: string
): string {
  const key = `board.${boardId}.${field}`;
  const dict = locales[locale] || locales.en;
  return (dict as any)[key] || (locales.en as any)[key] || fallback;
}

