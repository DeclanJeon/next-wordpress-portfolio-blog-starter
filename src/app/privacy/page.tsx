import type { Metadata } from "next";
import {
  ADSENSE_CLIENT,
  GA_MEASUREMENT_ID,
  SITE_AUTHOR,
  SITE_NAME,
  SITE_URL,
  pageMetadata,
} from "@/lib/seo";
const enabledPolicyServices = [GA_MEASUREMENT_ID ? "Google Analytics" : null, ADSENSE_CLIENT ? "AdSense" : null]
  .filter((service): service is string => Boolean(service))
  .join(", ")

export const metadata: Metadata = pageMetadata({
  title: "개인정보처리방침",
  description: `${SITE_NAME}의 ${enabledPolicyServices || "쿠키 및 개인정보"} 처리 기준을 안내합니다.`,
  path: "/privacy",
});

const sectionClass = "space-y-3";
const listClass = "list-disc space-y-2 pl-5";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
      <article className="space-y-12">
        <header className="space-y-5 border-b border-border/70 pb-10">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Privacy policy
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">개인정보처리방침</h1>
          <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
            {SITE_NAME}은 방문자가 사이트를 안전하게 이용하고 콘텐츠를 개선할 수 있도록 필요한 범위에서만 정보를 처리합니다.
            이 페이지는 Google Analytics와 Google AdSense의 사용 여부, 쿠키 및 개인정보 처리 기준을 설명합니다.
          </p>
          <p className="text-sm text-muted-foreground">최종 수정일: 2026년 7월 12일</p>
        </header>

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">1. 운영자와 적용 범위</h2>
          <p className="leading-8">
            이 방침은 {SITE_URL}에서 제공하는 공개 페이지, 글, 프로젝트 소개 및 관련 정적 리소스에 적용됩니다.
            사이트에 표시되는 운영자 이름은 <strong>{SITE_AUTHOR}</strong>입니다. 방문자 대상 회원가입이나 공개 사용자 프로필 기능은 제공하지 않습니다. 운영자의 글 작성·관리 기능에는 별도 인증과 세션이 사용될 수 있으며, 방문자는 해당 기능에 접근하지 않습니다.
          </p>
          <p className="leading-8">
            운영자 인증 과정에서는 운영자 계정명과 인증 상태를 확인하기 위한 세션 정보가 처리될 수 있습니다. 이 기능은 글 작성과 관리 목적이며 일반 방문자의 콘텐츠 열람에는 필요하지 않습니다.
          </p>
          <p className="leading-8">
            글에 포함된 외부 링크를 통해 다른 서비스로 이동하면 해당 서비스의 개인정보처리방침이 적용됩니다. 외부 서비스에 정보를 입력하기 전에 그 서비스의 기준을 확인해 주세요.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">2. Google Analytics 4(GA4) 사용 사실</h2>
          {GA_MEASUREMENT_ID ? (
            <>
              <p className="leading-8">
                사이트는 방문 통계와 콘텐츠 이용 흐름을 이해하기 위해 Google Analytics 4(GA4)를 사용합니다. 현재 사이트에 연결된 측정 ID는 <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{GA_MEASUREMENT_ID}</code>입니다.
              </p>
              <p className="leading-8">GA4를 통해 다음과 같은 정보가 자동으로 처리될 수 있습니다.</p>
              <ul className={listClass}>
                <li>방문한 페이지의 주소와 제목, 유입 경로, 페이지 조회 및 방문 시각</li>
                <li>브라우저, 운영체제, 화면 크기, 언어와 같은 기기·환경 정보</li>
                <li>쿠키 또는 유사 기술로 생성되는 브라우저 식별자와 대략적인 지역 정보</li>
              </ul>
              <p className="leading-8">
                현재 사이트 코드는 이름, 이메일, 비밀번호, 광고 식별자 또는 사용자 ID 같은 값을 GA4 이벤트에 의도적으로 전달하지 않습니다. 다만 Google은 자체 정책과 설정에 따라 수집 정보를 처리할 수 있습니다.
              </p>
            </>
          ) : (
            <p className="leading-8">
              현재 이 배포에는 GA4 측정 ID가 설정되어 있지 않아 Google Analytics 이벤트를 전송하지 않습니다. GA4를 다시 활성화하는 경우 이 방침과 측정 설정을 함께 갱신합니다.
            </p>
          )}
        </section>

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">3. 쿠키 및 분석 데이터 사용</h2>
          <p className="leading-8">
            쿠키는 페이지 방문 여부와 이용 흐름을 구분하고, 통계가 중복 집계되는 것을 줄이며, 광고 기능을 제공하는 데 사용될 수 있습니다. 대표적으로 Google Analytics의 <code className="rounded bg-muted px-1.5 py-0.5 text-sm">_ga</code> 계열 쿠키가 사용될 수 있으며, 브라우저 설정이나 Google의 구현 변경에 따라 이름과 동작은 달라질 수 있습니다.
          </p>
          <p className="leading-8">
            브라우저 설정에서 쿠키를 차단하거나 기존 쿠키를 삭제할 수 있습니다. 쿠키를 차단하면 일부 통계 또는 광고 기능이 정상적으로 동작하지 않을 수 있습니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">4. AdSense 광고 쿠키 사용</h2>
          {ADSENSE_CLIENT ? (
            <>
              <p className="leading-8">
                사이트는 Google AdSense를 통해 광고를 제공합니다. 현재 광고 게시자 ID는 <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{ADSENSE_CLIENT}</code>입니다.
              </p>
              <p className="leading-8">
                Google 및 광고 파트너는 광고를 제공·측정하고 부적절한 광고를 제한하기 위해 쿠키, 광고 식별자 또는 유사 기술을 사용할 수 있습니다. 광고의 개인화 여부와 처리 방식은 Google의 정책, 사용자의 지역, 브라우저 설정 및 Google 계정 설정에 따라 달라질 수 있습니다.
              </p>
              <p className="leading-8">
                광고 개인화는 <a className="underline underline-offset-4" href="https://adssettings.google.com/authenticated" rel="noreferrer">Google 광고 설정</a>에서 관리할 수 있습니다.
              </p>
            </>
          ) : (
            <p className="leading-8">
              현재 이 배포에는 AdSense 게시자 ID가 설정되어 있지 않아 Google 광고를 제공하지 않습니다. AdSense를 다시 활성화하는 경우 이 방침과 광고 설정을 함께 갱신합니다.
            </p>
          )}
        </section>

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">5. 제3자 서비스 제공자</h2>
          <p className="leading-8">사이트 운영에는 다음 제3자 서비스가 사용되거나 접속 과정에서 관여할 수 있습니다.</p>
          <ul className={listClass}>
            <li>
              <strong>Google LLC</strong>: 활성화된 경우 Google Analytics 4 분석, Google tag 전달, Google AdSense 광고 제공 및 측정. 자세한 내용은 <a className="underline underline-offset-4" href="https://policies.google.com/privacy" rel="noreferrer">Google 개인정보처리방침</a>과 <a className="underline underline-offset-4" href="https://policies.google.com/technologies/partner-sites" rel="noreferrer">Google 파트너 사이트 정책</a>을 확인할 수 있습니다.
            </li>
            <li>
              <strong>Cloudflare, Inc.</strong>: 도메인, CDN 및 보안 계층이 제공하는 요청 처리·보호 기능이 사용될 수 있습니다. Cloudflare Insights beacon이 응답에 삽입되는 경우 성능·이용 측정 정보도 처리될 수 있습니다. 관련 기준은 <a className="underline underline-offset-4" href="https://www.cloudflare.com/privacypolicy/" rel="noreferrer">Cloudflare 개인정보처리방침</a>에 따릅니다.
            </li>
            <li>
              <strong>PonsLink Public Desk</strong>: 문의 링크를 통해 별도 문의 서비스를 이용하는 경우, 입력한 정보는 해당 서비스로 직접 전송되며 그 서비스의 처리 기준이 적용됩니다.
            </li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">6. 맞춤 광고 및 분석 선택 해제</h2>
          <ul className={listClass}>
            <li>Google 광고 개인화 설정은 <a className="underline underline-offset-4" href="https://adssettings.google.com/authenticated" rel="noreferrer">Google 광고 설정</a>에서 변경할 수 있습니다.</li>
            <li>Google Analytics 분석 수집은 <a className="underline underline-offset-4" href="https://tools.google.com/dlpage/gaoptout" rel="noreferrer">Google Analytics 차단 브라우저 부가기능</a>으로 선택 해제할 수 있습니다.</li>
            <li>브라우저의 쿠키 삭제·차단 기능과 기기의 광고 추적 제한 설정을 사용할 수 있습니다.</li>
          </ul>
          <p className="leading-8">
            선택 해제는 브라우저·기기별로 적용될 수 있고, 쿠키를 다시 허용하거나 다른 기기를 사용하면 설정이 달라질 수 있습니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">7. 개인정보 보관 및 삭제</h2>
          <p className="leading-8">
            사이트는 회원 계정이나 자체 분석 데이터베이스를 운영하지 않습니다. GA4 이벤트 데이터의 보관 기간은 연결된 Google Analytics 속성의 데이터 보관 설정을 따르며, 사이트 코드에서 별도의 기간을 지정하지 않습니다. 광고·분석 데이터의 삭제 또는 처리 제한은 Google의 해당 기능과 정책에 따라 진행됩니다.
          </p>
          <p className="leading-8">
            사이트 제공에 필요한 서버·CDN 요청 로그는 운영 인프라와 보안·장애 대응 설정에 따라 처리될 수 있습니다. 확인되지 않은 로그 보관 기간을 이 방침에서 임의로 특정하지 않습니다.
          </p>
          <p className="leading-8">
            개인정보 처리 또는 삭제에 관한 요청은 아래 문의처로 보내 주세요. 요청을 처리하려면 어떤 브라우저·페이지·시점의 데이터인지 확인할 수 있는 최소한의 정보가 필요할 수 있으며, Google 등 제3자가 보관하는 데이터는 해당 제공자의 삭제 절차가 함께 필요할 수 있습니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">8. 문의처</h2>
          <p className="leading-8">
            개인정보, 쿠키, 분석 또는 광고 처리에 관한 문의는 <a className="underline underline-offset-4" href="https://ponslink.com/public-desk/declan" rel="noreferrer">PonsLink Public Desk</a>를 이용해 주세요.
          </p>
          <p className="leading-8">
            외부 문의 서비스에 개인정보를 입력하는 경우 그 서비스로 정보가 전송됩니다. 문의 내용에는 문제 해결에 필요한 정보만 포함해 주세요.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">9. 방침 변경</h2>
          <p className="leading-8">
            분석 도구, 광고 제공 방식, 사이트 기능 또는 관련 법령이 변경되면 이 방침도 변경될 수 있습니다. 변경된 내용은 이 페이지에 게시하고 최종 수정일을 갱신합니다.
          </p>
        </section>

      </article>
    </main>
  );
}
