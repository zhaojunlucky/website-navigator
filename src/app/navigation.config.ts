// navigation.config.ts
export const NAVIGATION_DATA = {
  searchEngine: "https://www.google.com/search?q=[VEDA]",
  categories: [
    {
      name: "Favorites",
      icon: "favorite",
      items: [
        {
          name: "QRCode",
          url: "https://gundamz.dev/utilities/codec/qrcode",
        },
        {
          name: "Jun's Learning",
          url: "https://exia.dev",
        },
        {
          name: "NodeSeek",
          url: "https://www.nodeseek.com",
        },
        {
          name: "V2EX",
          url: "https://v2ex.com",
          favicon: "https://v2ex.com/favicon.ico"
        },
        {
          name: "博客",
          url: "https://gundamz.de",
        },
        {
          name: "Dev Community",
          url: "https://dev.to",
          favicon: "https://dev.to/favicon.ico"
        },
        {
          name: "全球主机交流",
          url: "https://hostloc.com",
          favicon: "https://hostloc.com/favicon.ico"
        },
        {
          name: "Reddit",
          url: "https://www.reddit.com",
          favicon: "https://www.reddit.com/favicon.ico"
        },
        {
          name: "Google Gemini",
          url: "https://gemini.google.com",
        },
        {
          name: "特供 - HIFI",
          url: "https://hifini.com/forum-17.htm",
          favicon: "https://hifini.com/favicon.ico"
        },
        {
          name: "地铁e族",
          url: "https://www.ditiee.com/forum-40-1.html",
          favicon: "https://www.ditiee.com/favicon.ico"
        },
        {
          name: "知轩藏书",
          url: "https://zxcs.info/",
          favicon: "https://zxcs.info/favicon.ico"
        }
      ]
    },
    {
      name: "AI",
      items: [
        {
          name: "Google Gemini",
          url: "https://gemini.google.com",
        },
        {
          name: "DeepSeek",
          url: "https://chat.deepseek.com",
        },
        {
          name: "Exia",
          url: "https://ai.exia.dev",
        },
        {
          name: "Hugging chat",
          url: "https://huggingface.co/chat/",
          favicon: "https://huggingface.co/favicon.ico"
        }
      ]
    },
    {
      name: "Social",
      items: [
        {
          name: "X",
          url: "https://x.com",
          favicon: "https://x.com/favicon.ico"
        }
      ]
    }
  ]
};


export interface NavigationData {
  searchEngine: string;
  categories: {
    name: string;
    icon?: string;
    items: {
      name: string;
      url: string;
      favicon?: string;
    }[];
  }[];
}
