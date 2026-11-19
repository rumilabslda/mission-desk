import {
  companyDomain,
  emailFromGmailTitle,
  faviconUrl,
  googlePhotoAtSize,
  fitWithin,
  iconCandidates,
  isAllowedImageUrl,
  isDefaultWorkspaceLogo,
  pickGooglePhoto,
} from '../src/main/avatars/sources';

describe('emailFromGmailTitle', () => {
  test.each([
    ['Inbox (3) - joao@acme.com - Gmail', 'joao@acme.com'],
    ['Caixa de entrada - ana@empresa.pt - Gmail', 'ana@empresa.pt'],
    ['Sent Mail - user@example.com - Gmail', 'user@example.com'],
    ['Gmail', null],
    ['Inbox - not-an-email - Gmail', null],
  ])('%s → %s', (title, email) => {
    expect(emailFromGmailTitle(title)).toBe(email);
  });
});

describe('companyDomain', () => {
  test('a Workspace address has a company domain', () => {
    expect(companyDomain('joao@Acme.com')).toBe('acme.com');
  });
  test('personal Google addresses have none', () => {
    expect(companyDomain('x@gmail.com')).toBeNull();
    expect(companyDomain('x@googlemail.com')).toBeNull();
  });
});

describe('googlePhotoAtSize', () => {
  test('asks Google for a larger photo', () => {
    expect(googlePhotoAtSize('https://lh3.googleusercontent.com/a/ABC=s32-c-mo', 128)).toBe(
      'https://lh3.googleusercontent.com/a/ABC=s128-c-mo',
    );
  });
  test('leaves URLs without a size alone', () => {
    expect(googlePhotoAtSize('https://lh3.googleusercontent.com/a/ABC', 128)).toBe('https://lh3.googleusercontent.com/a/ABC');
  });
});

describe('iconCandidates (company first, then person)', () => {
  const photo = 'https://lh3.googleusercontent.com/a/P=s32-c';
  test('Workspace account: company logo, then the person photo', () => {
    expect(iconCandidates({ service: 'google', email: 'j@acme.com', photoUrl: photo })).toEqual([
      faviconUrl('acme.com'),
      'https://lh3.googleusercontent.com/a/P=s128-c',
    ]);
  });
  test('personal Gmail: only the person photo', () => {
    expect(iconCandidates({ service: 'google', email: 'j@gmail.com', photoUrl: photo })).toEqual([
      'https://lh3.googleusercontent.com/a/P=s128-c',
    ]);
  });
  test('Slack: the workspace icon', () => {
    expect(iconCandidates({ service: 'slack', companyIconUrl: 'https://avatars.slack-edge.com/t.png' })).toEqual([
      'https://avatars.slack-edge.com/t.png',
    ]);
  });
  test('WhatsApp: the person photo', () => {
    expect(iconCandidates({ service: 'whatsapp', photoUrl: 'https://pps.whatsapp.net/v/p.jpg' })).toEqual([
      'https://pps.whatsapp.net/v/p.jpg',
    ]);
  });
  test('page-supplied URLs from the wrong host are dropped', () => {
    expect(iconCandidates({ service: 'google', email: 'j@gmail.com', photoUrl: 'https://evil.example/x.png' })).toEqual([]);
  });
  test('nothing known: no candidates', () => {
    expect(iconCandidates({ service: 'whatsapp' })).toEqual([]);
  });
});

describe('isAllowedImageUrl', () => {
  test.each([
    ['google', 'https://lh3.googleusercontent.com/a/x', true],
    ['slack', 'https://avatars.slack-edge.com/2024/t_132.png', true],
    ['whatsapp', 'https://pps.whatsapp.net/v/t61/x.jpg', true],
    ['google', 'http://lh3.googleusercontent.com/a/x', false],
    ['google', 'https://avatars.slack-edge.com/x.png', false],
    ['slack', 'https://evil.example/x.png', false],
    ['whatsapp', 'javascript:alert(1)', false],
  ] as const)('%s %s → %s', (service, url, ok) => {
    expect(isAllowedImageUrl(service, url)).toBe(ok);
  });
});

describe('real Workspace pages (from the user\'s accounts)', () => {
  test('the email is found when the title ends in "<Company> Mail"', () => {
    expect(emailFromGmailTitle('Inbox - joao@acme.com - Acme Group Mail')).toBe('joao@acme.com');
    expect(emailFromGmailTitle('Inbox (4) - joao@acme.com - Globex Mail')).toBe('joao@acme.com');
  });

  test('Workspace photos on lh3.google.com are allowed', () => {
    expect(isAllowedImageUrl('google', 'https://lh3.google.com/u/0/ogw/ABC=s64-c-mo')).toBe(true);
  });

  test('the Workspace company logo is allowed, other www.google.com paths are not', () => {
    expect(isAllowedImageUrl('google', 'https://www.google.com/u/0/ac/images/logo.gif?uid=1')).toBe(true);
    expect(isAllowedImageUrl('google', 'https://www.google.com/search?q=x')).toBe(false);
  });

  test('order for Workspace: company logo from the page, then favicon, then photo', () => {
    expect(
      iconCandidates({
        service: 'google',
        email: 'j@acme.com',
        companyIconUrl: 'https://www.google.com/u/0/ac/images/logo.gif',
        photoUrl: 'https://lh3.google.com/u/0/ogw/P=s64-c-mo',
      }),
    ).toEqual([
      'https://www.google.com/u/0/ac/images/logo.gif',
      faviconUrl('acme.com'),
      'https://lh3.google.com/u/0/ogw/P=s128-c-mo',
    ]);
  });
});

describe('pickGooglePhoto', () => {
  test('skips the decorative ring and takes the photo', () => {
    expect(
      pickGooglePhoto([
        'https://ssl.gstatic.com/gb/images/ring/x.png',
        'https://lh3.googleusercontent.com/ogw/P=s32-c-mo',
      ]),
    ).toBe('https://lh3.googleusercontent.com/ogw/P=s32-c-mo');
    expect(pickGooglePhoto(['https://lh3.google.com/u/0/ogw/P=s64-c-mo'])).toBe('https://lh3.google.com/u/0/ogw/P=s64-c-mo');
    expect(pickGooglePhoto(['https://ssl.gstatic.com/gb/images/ring/x.png'])).toBeUndefined();
  });
});

describe('fitWithin', () => {
  test('keeps the shape of wide company logos', () => {
    expect(fitWithin({ width: 143, height: 59 }, 96)).toEqual({ width: 96, height: 40 });
    expect(fitWithin({ width: 128, height: 128 }, 96)).toEqual({ width: 96, height: 96 });
  });
});

describe('isDefaultWorkspaceLogo', () => {
  const logo = 'https://www.google.com/u/0/ac/images/logo.gif';
  test("Google's default logo (360×119) is not a company logo", () => {
    expect(isDefaultWorkspaceLogo(logo, { width: 360, height: 119 })).toBe(true);
  });
  test('custom company logos (320×132) are kept', () => {
    expect(isDefaultWorkspaceLogo(logo, { width: 320, height: 132 })).toBe(false);
  });
  test('only applies to the Workspace logo URL', () => {
    expect(isDefaultWorkspaceLogo('https://lh3.google.com/u/0/ogw/x=s128', { width: 360, height: 119 })).toBe(false);
  });
});
