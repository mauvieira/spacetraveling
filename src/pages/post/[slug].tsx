import { useEffect } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { minutesToHours } from 'date-fns';
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";

import { getPrismicClient } from '../../services/prismic';
import { formatDate, formatDateWithHours } from '../../util/formatDate';

import Header from "../../components/Header";

import styles from './post.module.scss';
import commonStyles from '../../styles/common.module.scss';

type PostLink = {
  slug: string;
  title: string;
}

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  next_post: PostLink | null;
  previous_post: PostLink | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post(props: PostProps) {

  const { isFallback } = useRouter();

  if (isFallback) {
    return <h1>Carregando...</h1>;
  }

  const { post } = props;

  const {
    first_publication_date,
    last_publication_date,
    next_post,
    previous_post,
    data: {
      title,
      banner: { url },
      author,
      content
    }
  } = post;

  const headingWordsPerMinutes = content.reduce((accumulator, { heading }) => {

    const length = heading?.split(/\s+/).length;

    return length ? length + accumulator : accumulator;

  }, 0);

  const bodyWordsPerMinutes = content.reduce((accumulator, { body }) => {
    return RichText.asText(body)?.split(/\s+/).length + accumulator;
  }, 0);

  const wordsPerMinutes = Math.ceil(
    (headingWordsPerMinutes + bodyWordsPerMinutes) / 200
  );

  const calculateReadingTime = () => {
    if (wordsPerMinutes < 1) {
      return 'Fast reading';
    }

    if (wordsPerMinutes < 60) {
      return `${wordsPerMinutes} min`;
    }

    return `${minutesToHours(wordsPerMinutes)} hours`;
  }

  const readingTime = calculateReadingTime();

  useEffect(() => {
    let script = document.createElement("script");
    let anchor = document.getElementById("inject-comments-for-uterances");
    script.setAttribute("src", "https://utteranc.es/client.js");
    script.setAttribute("crossorigin", "anonymous");
    script.setAttribute("repo", "vieiramauricio/spacetraveling-comments");
    script.setAttribute("issue-term", "pathname");
    script.setAttribute("theme", "github-dark");
    anchor.appendChild(script);
  }, []);

  return (
    <>
      <Head>
        <title>{title} | Spacetraveling</title>
      </Head>

      <Header />

      <img className={styles.banner} src={url} alt={`${title} - banner`} />

      <main className={commonStyles.container}>
        <div className={styles.container}>
          <h1>{title}</h1>
          <div className={styles.info}>
            <span><FiCalendar />{first_publication_date}</span>
            <span><FiUser /> {author}</span>
            <span><FiClock />{readingTime}</span>
          </div>
          <span className={styles.edit}>* edited {last_publication_date}</span>
          <section className={styles.postWrapper}>
            {content.map(({ heading, body }) => (
              <article className={styles.post} key={heading}>
                <h2>{heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(body),
                  }}
                />
              </article>
            ))}
          </section>

          <footer className={styles.footer}>
            <div>
              {previous_post &&
                <Link href={`/post/${previous_post.slug}`}>
                  <a>
                    {previous_post.title}
                    <span>Previous post</span>
                  </a>
                </Link>
              }
            </div>
            <div>
              {next_post &&
                <Link href={`/post/${next_post.slug}`}>
                  <a>
                    {next_post.title}
                    <span>Next post</span>
                  </a>
                </Link>
              }
            </div>
          </footer>
        </div>
      </main>

      <div id="inject-comments-for-uterances" />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.slug'],
    }
  );

  const params = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths: params,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {

  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.uid', 'posts.title'],
    }
  );

  const slugsWithTitle = posts.results.map(result => ({
    slug: result.uid,
    title: result.data.title
  }));

  const slugs = posts.results.map(result => result.uid);

  const postPosition = slugs.indexOf(String(slug));

  const next_post = slugsWithTitle[postPosition + 1] ?? null;
  const previous_post = slugsWithTitle[postPosition - 1] ?? null;

  const post = {
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url ?? '',
      },
      author: response.data.author,
      content: response.data.content.map(({ heading, body }) => ({
        heading: heading,
        body: body,
      })),
    },
    uid: response.uid,
    first_publication_date: formatDate(response.first_publication_date),
    last_publication_date: formatDateWithHours(response.last_publication_date),
    next_post,
    previous_post
  } as Post;

  return {
    props: {
      post
    },
    revalidate: 60 * 30,
  }
};
